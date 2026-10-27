// Model card: real numbers from the project (Experiments 5 to 8). Edit DATA below if the numbers ever change.
const DATA = {
  kpis: [
    { label: "Macro-F1", value: "0.787", note: "target 0.75 or more" },
    { label: "Accuracy", value: "83.3%", note: "2,165 test tweets" },
    { label: "Negative recall", value: "88.9%", note: "target 85% or more" },
    { label: "Errors", value: "16.7%", note: "362 of 2,165 tweets" },
  ],
  classes: ["negative", "neutral", "positive"],
  confusion: [
    [1211, 121, 31],
    [89, 321, 49],
    [29, 43, 271],
  ],
  perClass: [
    { name: "Negative", p: "0.911", r: "0.888", f1: "0.900", n: "1,363" },
    { name: "Neutral", p: "0.662", r: "0.699", f1: "0.680", n: "459" },
    { name: "Positive", p: "0.772", r: "0.790", f1: "0.781", n: "343" },
  ],
  models: [
    { name: "Logistic Regression (TF-IDF)", acc: "0.779", f1: "0.730", nr: "0.822" },
    { name: "Linear SVM (TF-IDF)", acc: "0.794", f1: "0.734", nr: "0.876" },
    { name: "DistilBERT (fine-tuned)", acc: "0.833", f1: "0.787", nr: "0.889", best: true },
  ],
};

function Confusion() {
  const { classes, confusion } = DATA;
  return (
    <div className="cm" role="table" aria-label="Confusion matrix on the test set">
      <div className="cm-corner muted small">Actual / Predicted</div>
      {classes.map((c) => (
        <div key={c} className="cm-head">
          {c}
        </div>
      ))}
      {confusion.map((row, i) => {
        const total = row.reduce((a, b) => a + b, 0);
        return [
          <div key={`h${i}`} className="cm-head cm-side">
            {classes[i]}
          </div>,
          ...row.map((v, j) => {
            const pct = (v / total) * 100;
            return (
              <div
                key={`${i}-${j}`}
                className={i === j ? "cm-cell diag" : "cm-cell"}
                style={{ background: `color-mix(in srgb, ${i === j ? "var(--pos)" : "var(--neg)"} ${Math.round(pct * 0.8)}%, var(--card))` }}
              >
                <div className="cm-num">{v}</div>
                <div className="muted small">{pct.toFixed(0)}%</div>
              </div>
            );
          }),
        ];
      })}
    </div>
  );
}

export default function ModelCard() {
  return (
    <section>
      <div className="card">
        <div className="field-label">Model card</div>
        <p className="mc-p">
          This app labels a tweet as <b>negative</b>, <b>neutral</b> or <b>positive</b> using a DistilBERT model fine-tuned on airline tweets, so a team can spot complaints and negative spikes quickly.
          All numbers below were measured on a <b>held-out test set</b> of 2,165 tweets that was not used for training or tuning.
        </p>
        <div className="kpis">
          {DATA.kpis.map((k) => (
            <div className="kpi" key={k.label}>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-label">{k.label}</div>
              <div className="muted small">{k.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="field-label">How it was built</div>
          <ul className="mc-list">
            <li><b>Data:</b> Twitter US Airline Sentiment, 14,640 tweets (14,427 after removing duplicates), split 70 / 15 / 15 with the same class mix in every split.</li>
            <li><b>Model:</b> distilbert-base-uncased, fine-tuned with a class-weighted loss because 63% of the tweets are negative.</li>
            <li><b>Training:</b> learning rate 2e-5, batch size 32, up to 4 epochs; the best epoch (2) was chosen on the validation set.</li>
            <li><b>Input:</b> tweets are cleaned (mentions, links, hashtags, emojis) and cut at 64 tokens.</li>
            <li><b>Web version:</b> compressed to ONNX int8 (67 MB instead of 268 MB) so it runs on a free server.</li>
          </ul>
        </div>

        <div className="card">
          <div className="field-label">Web version vs original model</div>
          <div className="table-wrap flat">
            <table>
              <thead>
                <tr><th></th><th>Original</th><th>This app</th></tr>
              </thead>
              <tbody>
                <tr><td>Macro-F1</td><td>0.787</td><td>0.788</td></tr>
                <tr><td>Accuracy</td><td>83.3%</td><td>82.9%</td></tr>
                <tr><td>Negative recall</td><td>88.9%</td><td>86.4%</td></tr>
                <tr><td>Same label as original</td><td>-</td><td>95.6% of tweets</td></tr>
              </tbody>
            </table>
          </div>
          <p className="muted small">Compression makes the model smaller with a small loss in negative recall. Both versions meet the project targets.</p>
        </div>
      </div>

      <div className="card">
        <div className="field-label">Compared with simpler models (test set)</div>
        <div className="table-wrap flat">
          <table>
            <thead>
              <tr><th>Model</th><th>Accuracy</th><th>Macro-F1</th><th>Negative recall</th></tr>
            </thead>
            <tbody>
              {DATA.models.map((m) => (
                <tr key={m.name} className={m.best ? "best-row" : ""}>
                  <td>{m.name}{m.best ? " (used here)" : ""}</td><td>{m.acc}</td><td>{m.f1}</td><td>{m.nr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">The macro-F1 gain of DistilBERT over the best simple model is statistically reliable (95% interval of the difference: 0.033 to 0.074).</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="field-label">Confusion matrix (test set)</div>
          <Confusion />
          <p className="muted small">Rows are the real labels, columns the predictions. Green cells are correct predictions; red cells are mistakes. Percent is the share of each real class.</p>
        </div>

        <div className="card">
          <div className="field-label">Results per class</div>
          <div className="table-wrap flat">
            <table>
              <thead>
                <tr><th>Class</th><th>Precision</th><th>Recall</th><th>F1</th><th>Tweets</th></tr>
              </thead>
              <tbody>
                {DATA.perClass.map((c) => (
                  <tr key={c.name}><td>{c.name}</td><td>{c.p}</td><td>{c.r}</td><td>{c.f1}</td><td>{c.n}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">Negative tweets are found best. Neutral is the hardest class.</p>
        </div>
      </div>

      <div className="card">
        <div className="field-label">Limitations: when to double-check</div>
        <ul className="mc-list">
          <li><b>Neutral is confused most.</b> About 83% of all mistakes involve the neutral class (for example a polite complaint labelled neutral). Direct swaps between negative and positive are rare (2.8% of tweets).</li>
          <li><b>Sarcasm and mixed feelings</b> (praise for a person, anger at the airline) are hard. Some "mistakes" are also debatable human labels.</li>
          <li><b>Short tweets are harder:</b> about 22% to 24% errors for tweets of up to 14 words, against about 14% for longer ones.</li>
          <li><b>Narrow training data:</b> English tweets about US airlines from 2015. New slang, other languages and other industries can lower accuracy.</li>
          <li><b>Confidence helps but is not perfect.</b> Average confidence was 90% on correct and 75% on wrong predictions, yet 104 mistakes still had confidence above 90%. Tweets below 60% confidence are flagged "needs review".</li>
          <li><b>Use as support, not as the final judge.</b> Check flagged tweets and a random sample by hand before acting on the results.</li>
        </ul>
      </div>
    </section>
  );
}
