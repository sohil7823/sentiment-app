import { useState } from "react";
import { predictOne } from "../api.js";
import { EXAMPLES, MAX_CHARS } from "../constants.js";
import ExplainView from "./ExplainView.jsx";
import ResultCard, { Badge } from "./ResultCard.jsx";

export default function Analyzer({ history, onResults }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function run(value = text) {
    const t = value.trim();
    if (!t || loading) return;
    setLoading(true);
    setError("");
    try {
      const r = await predictOne(t);
      setResult(r);
      onResults([r]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const recent = history.slice(-6).reverse();

  return (
    <section className="grid-2">
      <div>
        <div className="card">
          <label htmlFor="tweet" className="field-label">
            Paste a tweet or a customer mention
          </label>
          <textarea
            id="tweet"
            rows={5}
            maxLength={MAX_CHARS}
            value={text}
            placeholder="@airline my flight was delayed again..."
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") run();
            }}
          />
          <div className="row between">
            <span className="muted small">
              {text.length}/{MAX_CHARS} characters. Ctrl + Enter to analyse
            </span>
            <button className="btn primary" disabled={!text.trim() || loading} onClick={() => run()}>
              {loading ? "Analysing..." : "Analyse"}
            </button>
          </div>
          {error && <div className="notice error">{error}</div>}
          {loading && <div className="muted small">The first request after a quiet period can take a few seconds while the model starts.</div>}
        </div>

        <div className="card">
          <div className="field-label">Try an example</div>
          <div className="chips">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                className="chip"
                onClick={() => {
                  setText(ex);
                  run(ex);
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        {result ? (
          <>
            <ResultCard result={result} />
            <ExplainView key={`${result.text}|${result.confidence}`} text={result.text} result={result} />
          </>
        ) : (
          <div className="card empty">The result will appear here.</div>
        )}

        {recent.length > 0 && (
          <div className="card">
            <div className="field-label">Recent analyses</div>
            <ul className="recent">
              {recent.map((h) => (
                <li key={h.id}>
                  <Badge sentiment={h.sentiment} />
                  <span className="recent-text" title={h.text}>
                    {h.text}
                  </span>
                  <span className="muted small">{Math.round(h.confidence * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
