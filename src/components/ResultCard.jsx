import { CLASSES, META } from "../constants.js";

export function Badge({ sentiment }) {
  const m = META[sentiment];
  return (
    <span className="badge" style={{ color: m.color, background: m.soft }}>
      {m.label}
    </span>
  );
}

export default function ResultCard({ result }) {
  const m = META[result.sentiment];
  const pct = Math.round(result.confidence * 100);
  return (
    <div className="card result" style={{ borderTopColor: m.color }}>
      <div className="result-head">
        <div>
          <div className="muted small">Predicted sentiment</div>
          <div className="result-label" style={{ color: m.color }}>
            {m.label}
          </div>
        </div>
        <div className="result-conf">
          <div className="muted small">Confidence</div>
          <div className="result-pct">{pct}%</div>
        </div>
      </div>

      <div className="bars">
        {CLASSES.map((c) => {
          const p = (result.probabilities?.[c] ?? 0) * 100;
          return (
            <div className="bar-row" key={c}>
              <span className="bar-name">{META[c].label}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${p}%`, background: META[c].color }} />
              </div>
              <span className="bar-val">{p.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>

      {result.needs_review && (
        <div className="notice warn">
          Low confidence (below 60%). Please check this tweet manually before acting on it.
        </div>
      )}
    </div>
  );
}
