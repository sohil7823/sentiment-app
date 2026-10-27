import { useMemo, useState } from "react";
import { Badge } from "./ResultCard.jsx";

function Highlight({ text, query }) {
  const q = query.trim().toLowerCase();
  if (!q) return text;
  const lower = text.toLowerCase();
  const parts = [];
  let i = 0;
  let key = 0;
  for (;;) {
    const j = lower.indexOf(q, i);
    if (j === -1) break;
    if (j > i) parts.push(text.slice(i, j));
    parts.push(<mark key={key++}>{text.slice(j, j + q.length)}</mark>);
    i = j + q.length;
  }
  parts.push(text.slice(i));
  return parts;
}

const FILTERS = [
  ["all", "All"],
  ["negative", "Negative"],
  ["neutral", "Neutral"],
  ["positive", "Positive"],
  ["review", "Needs review"],
];

// rows: { text, sentiment, confidence, needs_review, airline?, extra?, skipped? }
export default function ResultsTable({ rows, showAirline = false, extraLabel = "", maxRows = 200 }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .map((r, i) => ({ ...r, n: i + 1 }))
      .filter((r) => {
        if (q && !r.text.toLowerCase().includes(q)) return false;
        if (filter === "review") return !r.skipped && r.needs_review;
        if (filter !== "all") return !r.skipped && r.sentiment === filter;
        return true;
      });
  }, [rows, query, filter]);

  return (
    <div>
      <div className="filterbar">
        <input
          type="search"
          className="search"
          placeholder="Filter by word, e.g. luggage"
          aria-label="Filter tweets by word"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chips-row">
          {FILTERS.map(([id, label]) => (
            <button key={id} className={filter === id ? "pill active" : "pill"} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="muted small" data-testid="filter-count">
        Showing {Math.min(shown.length, maxRows)} of {rows.length} tweets
        {shown.length > maxRows ? ` (first ${maxRows} of ${shown.length} matches)` : ""}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Tweet</th>
              {showAirline && <th>Airline</th>}
              <th>Sentiment</th>
              <th>Confidence</th>
              {extraLabel && <th>{extraLabel}</th>}
            </tr>
          </thead>
          <tbody>
            {shown.slice(0, maxRows).map((r) => (
              <tr key={r.n}>
                <td>{r.n}</td>
                <td className="cell-wrap">{r.text ? <Highlight text={r.text} query={query} /> : <span className="muted">(empty)</span>}</td>
                {showAirline && <td>{r.airline || "-"}</td>}
                <td>{r.skipped ? "-" : <Badge sentiment={r.sentiment} />}</td>
                <td>{r.skipped ? "-" : `${Math.round(r.confidence * 100)}%${r.needs_review ? " (review)" : ""}`}</td>
                {extraLabel && <td>{r.extra || "-"}</td>}
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5 + (showAirline ? 1 : 0) + (extraLabel ? 1 : 0)} className="muted">
                  No tweets match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
