import { useState } from "react";
import { predictBatch } from "../api.js";
import { MAX_CHARS } from "../constants.js";
import ResultCard from "./ResultCard.jsx";

const PAIR = [
  "@united the flight was delayed 3 hours and nobody told us anything",
  "@united the flight was delayed 3 hours but the crew was kind and kept us informed",
];

export default function Compare({ onResults }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [out, setOut] = useState(null);

  async function run() {
    if (!a.trim() || !b.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const [ra, rb] = await predictBatch([a.trim(), b.trim()]);
      setOut([ra, rb]);
      onResults([ra, rb]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  let summary = null;
  if (out) {
    const na = out[0].probabilities.negative * 100;
    const nb = out[1].probabilities.negative * 100;
    summary =
      Math.abs(na - nb) < 5
        ? `Both tweets get a similar negative score (${na.toFixed(0)}% and ${nb.toFixed(0)}%).`
        : `Tweet ${na > nb ? "A" : "B"} is more negative: ${na.toFixed(0)}% for A against ${nb.toFixed(0)}% for B.`;
  }

  return (
    <section>
      <div className="card">
        <div className="row between wrap" style={{ marginTop: 0 }}>
          <div>
            <div className="field-label">Compare two tweets side by side</div>
            <div className="muted small">Useful to see how a few extra words change the model's answer.</div>
          </div>
          <button
            className="btn"
            onClick={() => {
              setA(PAIR[0]);
              setB(PAIR[1]);
            }}
          >
            Use example pair
          </button>
        </div>
        <div className="grid-2" style={{ marginTop: 12 }}>
          <div>
            <label className="field-label" htmlFor="tweetA">Tweet A</label>
            <textarea id="tweetA" rows={4} maxLength={MAX_CHARS} value={a} onChange={(e) => setA(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="tweetB">Tweet B</label>
            <textarea id="tweetB" rows={4} maxLength={MAX_CHARS} value={b} onChange={(e) => setB(e.target.value)} />
          </div>
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn primary" disabled={!a.trim() || !b.trim() || loading} onClick={run}>
            {loading ? "Comparing..." : "Compare"}
          </button>
        </div>
        {error && <div className="notice error">{error}</div>}
      </div>

      {out && (
        <>
          <div className="notice" data-testid="compare-summary">{summary}</div>
          <div className="grid-2" style={{ marginTop: 16 }}>
            <div>
              <div className="field-label">Tweet A</div>
              <ResultCard result={out[0]} />
            </div>
            <div>
              <div className="field-label">Tweet B</div>
              <ResultCard result={out[1]} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
