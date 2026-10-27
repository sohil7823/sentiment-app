import { useMemo } from "react";
import { CLASSES, META } from "../constants.js";
import { downloadText, toCSV } from "../csv.js";
import { Badge } from "./ResultCard.jsx";
import ConfirmButton from "./ConfirmButton.jsx";

export default function ReviewQueue({ history, reviews, extraQueue, onReview, onAddRandom, onResetReviews }) {
  const { pending, done, candidates } = useMemo(() => {
    const extra = new Set(extraQueue);
    const queue = history
      .filter((h) => h.needs_review || extra.has(h.id))
      .map((h) => ({ ...h, source: h.needs_review ? "low confidence" : "random sample" }));
    return {
      pending: queue.filter((q) => !reviews[q.id]).sort((a, b) => a.confidence - b.confidence),
      done: queue.filter((q) => reviews[q.id]).reverse(),
      candidates: history.filter((h) => !h.needs_review && !extra.has(h.id)).length,
    };
  }, [history, reviews, extraQueue]);

  const agree = (arr) => arr.filter((d) => reviews[d.id] === d.sentiment).length;
  const low = done.filter((d) => d.source === "low confidence");
  const rnd = done.filter((d) => d.source === "random sample");

  function download() {
    const head = ["tweet", "airline", "model_label", "confidence", "human_label", "model_correct", "source"];
    const rows = done.map((d) => [d.text, d.airline || "", d.sentiment, d.confidence, reviews[d.id], reviews[d.id] === d.sentiment, d.source]);
    downloadText("review_corrections.csv", toCSV([head, ...rows]));
  }

  return (
    <section>
      <div className="card">
        <div className="row between wrap" style={{ marginTop: 0 }}>
          <div>
            <div className="field-label">Review queue</div>
            <div className="muted small">
              Tweets the model is unsure about (confidence below 60%) land here automatically. Pick the correct label for each one.
              The result is a file of human-checked labels that can be used to measure real accuracy and to retrain the model later.
            </div>
          </div>
          <div className="row gap wrap" style={{ marginTop: 0 }}>
            <button className="btn" disabled={candidates === 0} onClick={() => onAddRandom(10)} title="Adds confident tweets too, so you can check for hidden mistakes">
              Add 10 random tweets
            </button>
            <button className="btn primary" disabled={done.length === 0} onClick={download}>
              Download corrections CSV
            </button>
          </div>
        </div>

        <div className="stats" style={{ marginTop: 14 }}>
          <div className="stat"><div className="stat-num" data-testid="q-pending">{pending.length}</div><div className="muted small">To review</div></div>
          <div className="stat"><div className="stat-num" data-testid="q-done">{done.length}</div><div className="muted small">Reviewed</div></div>
          <div className="stat">
            <div className="stat-num">{done.length ? `${Math.round((agree(done) / done.length) * 100)}%` : "-"}</div>
            <div className="muted small">Model agreed with you</div>
          </div>
        </div>
        {done.length > 0 && (
          <div className="muted small" style={{ marginTop: 8 }}>
            Low-confidence tweets: model right on {agree(low)} of {low.length}. Random sample: model right on {agree(rnd)} of {rnd.length}.
            The random sample is the fairer estimate of overall accuracy; low-confidence tweets are expected to be harder.
          </div>
        )}
      </div>

      <div className="card">
        <div className="field-label">To review ({pending.length})</div>
        {pending.length === 0 ? (
          <div className="muted small">
            {history.length === 0
              ? "Nothing here yet. Analyse some tweets first."
              : "Nothing to review right now. Tweets below 60% confidence will appear here, or add some random tweets above."}
          </div>
        ) : (
          <ul className="queue">
            {pending.slice(0, 50).map((q) => (
              <li key={q.id} className="queue-item">
                <div className="queue-text">{q.text}</div>
                <div className="row gap wrap" style={{ marginTop: 6 }}>
                  <span className="small muted">Model says</span>
                  <Badge sentiment={q.sentiment} />
                  <span className="small muted">{Math.round(q.confidence * 100)}% ({q.source})</span>
                </div>
                <div className="row gap wrap">
                  <span className="small">Correct label:</span>
                  {CLASSES.map((c) => (
                    <button key={c} className="pill label-btn" style={{ borderColor: META[c].color, color: META[c].color }} onClick={() => onReview(q.id, c)}>
                      {META[c].label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
        {pending.length > 50 && <div className="muted small">Showing the first 50 (lowest confidence first).</div>}
      </div>

      {done.length > 0 && (
        <div className="card">
          <div className="row between wrap" style={{ marginTop: 0 }}>
            <div className="field-label">Reviewed ({done.length})</div>
            <ConfirmButton label="Reset all reviews" onConfirm={onResetReviews} />
          </div>
          <ul className="queue">
            {done.slice(0, 50).map((d) => {
              const ok = reviews[d.id] === d.sentiment;
              return (
                <li key={d.id} className="queue-item">
                  <div className="queue-text">{d.text}</div>
                  <div className="row gap wrap" style={{ marginTop: 6 }}>
                    <span className="small muted">Model</span>
                    <Badge sentiment={d.sentiment} />
                    <span className="small muted">You</span>
                    <Badge sentiment={reviews[d.id]} />
                    <span className={ok ? "small ok-text" : "small err-text"}>{ok ? "model was right" : "model was wrong"}</span>
                    <button className="btn small-btn" onClick={() => onReview(d.id, null)}>Change</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
