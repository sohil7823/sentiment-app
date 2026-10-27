# Run these 3 cells in your Colab notebook (GPU not needed). They convert your trained
# DistilBERT (Drive: sentiment_project/models/distilbert_best) into a small ONNX int8 model
# that fits on Vercel, check its quality on the test set, and let you download the 2 files.

# ===================== CELL 1: export + quantize =====================
!pip install -q onnx onnxruntime transformers emoji nltk
import os, torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from onnxruntime.quantization import quantize_dynamic, QuantType
from google.colab import drive
drive.mount("/content/drive")

save_dir = "/content/drive/MyDrive/sentiment_project"
src = f"{save_dir}/models/distilbert_best"
out = f"{save_dir}/vercel_model"
os.makedirs(out, exist_ok=True)

tok = AutoTokenizer.from_pretrained(src)
model = AutoModelForSequenceClassification.from_pretrained(src).to("cpu").eval()
enc = tok(["@united my flight was delayed", "thanks a lot, great crew"], padding=True, return_tensors="pt")
inputs = (enc["input_ids"], enc["attention_mask"])
kwargs = dict(
    input_names=["input_ids", "attention_mask"], output_names=["logits"],
    dynamic_axes={"input_ids": {0: "batch", 1: "seq"}, "attention_mask": {0: "batch", 1: "seq"}, "logits": {0: "batch"}},
    opset_version=14,
)
fp32 = f"{out}/model_fp32.onnx"
try:
    torch.onnx.export(model, inputs, fp32, dynamo=False, **kwargs)
except TypeError:                      # older torch versions have no 'dynamo' argument
    torch.onnx.export(model, inputs, fp32, **kwargs)

quantize_dynamic(fp32, f"{out}/model_int8.onnx", weight_type=QuantType.QInt8)
tok.save_pretrained(out)               # creates tokenizer.json
for f in ["model_fp32.onnx", "model_int8.onnx", "tokenizer.json"]:
    print(f, round(os.path.getsize(f"{out}/{f}") / 1e6, 1), "MB")


# ============ CELL 2: check that int8 ONNX is as good as the original ============
import sys, numpy as np, pandas as pd, onnxruntime as ort, nltk
nltk.download("stopwords")
sys.path.append(save_dir)
from text_utils import light_clean
from sklearn.metrics import f1_score, accuracy_score, recall_score

test = pd.read_csv(f"{save_dir}/test.csv")
y = test["label"].values
texts = [light_clean(t) for t in test["text"]]
sess = ort.InferenceSession(f"{out}/model_int8.onnx", providers=["CPUExecutionProvider"])

def onnx_logits(batch):
    e = tok(batch, truncation=True, max_length=64, padding=True, return_tensors="np")
    return sess.run(None, {"input_ids": e["input_ids"].astype("int64"),
                           "attention_mask": e["attention_mask"].astype("int64")})[0]

p_onnx = np.concatenate([onnx_logits(texts[i:i + 64]) for i in range(0, len(texts), 64)]).argmax(1)

p_torch = []
with torch.no_grad():
    for i in range(0, len(texts), 64):
        e = tok(texts[i:i + 64], truncation=True, max_length=64, padding=True, return_tensors="pt")
        p_torch.append(model(**e).logits.argmax(-1).numpy())
p_torch = np.concatenate(p_torch)

for name, p in [("PyTorch fp32", p_torch), ("ONNX int8", p_onnx)]:
    print(f"{name:13s} accuracy {accuracy_score(y, p):.4f} | macro-F1 {f1_score(y, p, average='macro'):.4f} "
          f"| negative recall {recall_score(y, p, labels=[0], average='macro'):.4f}")
print("Same prediction as PyTorch on", round((p_onnx == p_torch).mean() * 100, 2), "% of test tweets")
# Expected: PyTorch fp32 is about macro-F1 0.787 / negative recall 0.889 (Experiment 6).
# If int8 is clearly lower (for example macro-F1 more than 0.02 below), tell me before deploying.


# ===================== CELL 3: download the 2 files =====================
from google.colab import files
files.download(f"{out}/model_int8.onnx")
files.download(f"{out}/tokenizer.json")
# (or copy them from Drive: sentiment_project/vercel_model/)
