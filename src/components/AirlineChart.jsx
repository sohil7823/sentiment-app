import { useMemo } from "react";
import { META } from "../constants.js";

const NONE = "(no airline mentioned)";

export default function AirlineChart({ history }) {
  const rows = useMemo(() => {
    const m = new Map();
    history.forEach((h) => {
      const name = h.airline || NONE;
      const r = m.get(name) || { name, n: 0, negative: 0, neutral: 0, positive: 0 };
      r.n += 1;
      r[h.sentiment] += 1;
      m.set(name, r);
    });
    return [...m.values()]
      .map((r) => ({ ...r, negPct: (r.negative / r.n) * 100 }))
      .sort((a, b) => (a.name === NONE) - (b.name === NONE) || b.negPct - a.negPct);
  }, [history]);

  const detected = rows.some((r) => r.name !== NONE);

  return (
    <div className="card">
      <div className="field-label">Negative share by airline</div>
      {!detected ? (
        <div className="muted small">
          No airline found yet. Mention an airline in the tweet, for example @united or @Delta, and its share of negative tweets appears here.
        </div>
      ) : (
        <>
          <div className="airline-rows" data-testid="airline-rows">
            {rows.map((r) => (
              <div className="airline-row" key={r.name}>
                <div className="airline-name">
                  {r.name}
                  <span className="muted small"> {r.n} {r.n === 1 ? "tweet" : "tweets"}{r.n < 5 ? " (few)" : ""}</span>
                </div>
                <div className="stack" title={`${r.negative} negative, ${r.neutral} neutral, ${r.positive} positive`}>
                  {["negative", "neutral", "positive"].map((c) => (
                    <div key={c} style={{ width: `${(r[c] / r.n) * 100}%`, background: META[c].color }} />
                  ))}
                </div>
                <div className="airline-pct" style={{ color: META.negative.color }}>
                  {Math.round(r.negPct)}% negative
                </div>
              </div>
            ))}
          </div>
          <div className="muted small">
            The airline comes from the first airline @mention in each tweet. Percentages based on very few tweets are unreliable.
          </div>
        </>
      )}
    </div>
  );
}
