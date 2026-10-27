import { useMemo } from "react";
import { META } from "../constants.js";
import { exportHistoryCSV } from "../exportUtils.js";
import ConfirmButton from "./ConfirmButton.jsx";
import ResultsTable from "./ResultsTable.jsx";

export default function History({ history, reviews, onClear }) {
  const rows = useMemo(
    () => [...history].reverse().map((h) => ({ ...h, extra: reviews[h.id] ? META[reviews[h.id]].label : "" })),
    [history, reviews]
  );
  return (
    <section>
      <div className="card">
        <div className="row between wrap" style={{ marginTop: 0 }}>
          <div>
            <div className="field-label">History</div>
            <div className="muted small">
              Everything you analysed is saved in this browser (up to 1,000 tweets), so it is still here after a refresh. It is not sent anywhere else.
            </div>
          </div>
          <div className="row gap wrap" style={{ marginTop: 0 }}>
            <button className="btn primary" disabled={!history.length} onClick={() => exportHistoryCSV(history, reviews)}>
              Download CSV
            </button>
            <ConfirmButton label="Clear history" disabled={!history.length} onConfirm={onClear} />
          </div>
        </div>
      </div>
      {history.length === 0 ? (
        <div className="card empty">No tweets analysed yet.</div>
      ) : (
        <div className="card">
          <ResultsTable rows={rows} showAirline extraLabel="Your label" />
        </div>
      )}
    </section>
  );
}
