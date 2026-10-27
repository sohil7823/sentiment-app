# Tweet Sentiment Monitor (React + Vercel)

React web app + a Python API on Vercel that runs your fine-tuned DistilBERT (ONNX int8, CPU).

```
index.html, src/        React UI (Vite): analyse a tweet, batch CSV, live dashboard with spike alert
api/predict.py          Vercel Python function: GET = health, POST {"text"} or {"texts": [...]} (max 100)
model/                  model_int8.onnx + tokenizer.json  (created in Colab, see below)
requirements.txt        onnxruntime, tokenizers, numpy, emoji
vercel.json             bundles model/ into the function
colab_export_onnx.py    3 Colab cells: export + quantize + check + download
```

## 1. Make the model files (Colab)
Run the cells in `colab_export_onnx.py`. Put the two downloaded files into the `model/` folder:
`model/model_int8.onnx` (about 65 MB) and `model/tokenizer.json`.

## 2. Deploy on Vercel
Option A (GitHub, recommended): push this folder to a new GitHub repo (the model file is under GitHub's 100 MB limit),
then on vercel.com: Add New > Project > import the repo > Deploy. Framework (Vite) is detected automatically.

Option B (CLI): `npm i -g vercel`, then in this folder `vercel login` and `vercel --prod`.

## 3. Test
Open the site, wait for the green "Model service online" dot, click an example tweet.
API check: `curl -X POST https://YOUR-SITE.vercel.app/api/predict -H "Content-Type: application/json" -d '{"text":"my flight was delayed again"}'`

## Run locally (optional)
`npm install` then `npm run dev` shows the UI only (no API). For UI + API together:
`pip install -r requirements.txt`, `npm i -g vercel`, `vercel dev`.

## Notes
- First request after idle time is slower (cold start: the model loads).
- Same response format as the Experiment 7 API (sentiment, confidence, probabilities, needs_review below 0.60 confidence).
- Model: trained on 2015 English US-airline tweets; weak on sarcasm and mixed sentiment (see Experiment 6).
