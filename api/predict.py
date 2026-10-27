"""Vercel Python function: sentiment API (fine-tuned DistilBERT, ONNX int8).

GET  /api/predict                      -> health check
POST /api/predict {"text": "..."}      -> one tweet
POST /api/predict {"texts": ["..."]}   -> up to 100 tweets
"""
import json
import os
import re
from http.server import BaseHTTPRequestHandler

import emoji
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(HERE, "..", "model")
MODEL_FILE = os.path.join(MODEL_DIR, "model_int8.onnx")
TOKENIZER_FILE = os.path.join(MODEL_DIR, "tokenizer.json")

LABELS = ["negative", "neutral", "positive"]
MAXLEN = 64
MAX_CHARS = 1000
MAX_BATCH = 100
MAX_BODY_BYTES = 400_000
REVIEW_THRESHOLD = 0.60  # below this confidence -> needs_review = True

URL_RE = re.compile(r"https?://\S+|www\.\S+")
MENTION_RE = re.compile(r"@\w+")

_state = {}  # model is loaded once per warm instance


def light_clean(text):
    """Same cleaning as training (text_utils.light_clean in the notebook)."""
    text = str(text)
    text = URL_RE.sub("http", text)
    text = MENTION_RE.sub("@user", text)
    text = text.replace("#", "")
    text = emoji.demojize(text, delimiters=(" ", " ")).replace("_", " ")
    return re.sub(r"\s+", " ", text).strip()


def get_engine():
    if "sess" not in _state:
        import onnxruntime as ort
        from tokenizers import Tokenizer

        tok = Tokenizer.from_file(TOKENIZER_FILE)
        tok.enable_truncation(max_length=MAXLEN)
        tok.enable_padding(pad_id=tok.token_to_id("[PAD]") or 0, pad_token="[PAD]")
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 1
        sess = ort.InferenceSession(MODEL_FILE, opts, providers=["CPUExecutionProvider"])
        _state["sess"], _state["tok"] = sess, tok
    return _state["sess"], _state["tok"]


def predict(texts):
    sess, tok = get_engine()
    cleaned = [light_clean(t) for t in texts]
    encs = tok.encode_batch(cleaned)
    ids = np.array([e.ids for e in encs], dtype=np.int64)
    mask = np.array([e.attention_mask for e in encs], dtype=np.int64)
    logits = sess.run(None, {"input_ids": ids, "attention_mask": mask})[0]
    z = logits - logits.max(axis=1, keepdims=True)
    p = np.exp(z)
    p = p / p.sum(axis=1, keepdims=True)
    out = []
    for text, row in zip(texts, p):
        k = int(row.argmax())
        conf = float(row[k])
        out.append({
            "text": text,
            "sentiment": LABELS[k],
            "confidence": round(conf, 4),
            "probabilities": {l: round(float(v), 4) for l, v in zip(LABELS, row)},
            "needs_review": conf < REVIEW_THRESHOLD,
        })
    return out


def valid_text(t):
    return isinstance(t, str) and t.strip() != ""


class handler(BaseHTTPRequestHandler):
    def _send(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _err(self, code, msg):
        self._send(code, {"error": msg})

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        ready = os.path.exists(MODEL_FILE) and os.path.exists(TOKENIZER_FILE)
        self._send(200, {
            "status": "ok" if ready else "model files missing",
            "model": "distilbert-base-uncased (fine-tuned, ONNX int8)",
            "runtime": "onnxruntime (CPU)",
            "model_loaded": "sess" in _state,
        })

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            return self._err(400, "Invalid Content-Length header")
        if length > MAX_BODY_BYTES:
            return self._err(413, "Request body is too large")
        try:
            data = json.loads(self.rfile.read(length) or b"null")
        except Exception:
            return self._err(400, "Body must be valid JSON")
        if not isinstance(data, dict):
            return self._err(400, 'JSON body with a "text" or "texts" field is required')

        try:
            if "text" in data:
                text = data["text"]
                if not valid_text(text):
                    return self._err(400, '"text" must be a non-empty string')
                if len(text) > MAX_CHARS:
                    return self._err(413, f'"text" is too long (max {MAX_CHARS} characters)')
                return self._send(200, predict([text])[0])

            if "texts" in data:
                texts = data["texts"]
                if not isinstance(texts, list) or not texts:
                    return self._err(400, '"texts" must be a non-empty list')
                if len(texts) > MAX_BATCH:
                    return self._err(413, f"too many texts (max {MAX_BATCH} per request)")
                if not all(valid_text(t) and len(t) <= MAX_CHARS for t in texts):
                    return self._err(400, f'every item in "texts" must be a non-empty string of at most {MAX_CHARS} characters')
                results = predict(texts)
                return self._send(200, {"count": len(results), "results": results})

            return self._err(400, 'JSON body with a "text" or "texts" field is required')
        except FileNotFoundError:
            return self._err(500, "Model files not found: put model_int8.onnx and tokenizer.json in the model/ folder")
        except Exception as e:  # keep the server alive and return a clean error
            return self._err(500, f"Prediction failed: {type(e).__name__}")
