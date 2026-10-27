import { useMemo, useState } from "react";
import { predictBatch } from "../api.js";
import { CLASSES, MAX_CHARS, META } from "../constants.js";
import { downloadText, parseCSV, toCSV } from "../csv.js";
import { detectAirline } from "../airlines.js";
import ResultsTable from "./ResultsTable.jsx";

const MAX_ROWS = 500;
const CHUNK = 50;
const TEXT_COLUMNS = /^(text|tweet|content|message|comment|review)$/i;

export default function BatchUpload({ onResults }) {
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [column, setColumn] = useState(0);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setResults(null);
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCSV(String(reader.result));
      if (parsed.length < 2) {
        setError("The CSV needs a header row and at least one data row.");
        setHeaders([]);
        setRows([]);
        return;
      }
      const head = parsed[0].map((h) => h.trim());
      const idx = head.findIndex((h) => TEXT_COLUMNS.test(h));
      setHeaders(head);
      setRows(parsed.slice(1));
      setColumn(idx >= 0 ? idx : 0);
      setFileName(file.name);
    };
    reader.onerror = () => setError("Could not read the file.");
    reader.readAsText(file);
  }

  async function run() {
    setRunning(true);
    setError("");
    setProgress(0);
    try {
      const used = rows.slice(0, MAX_ROWS);
      const items = used.map((r) => (r[column] ?? "").trim().slice(0, MAX_CHARS));
      const out = items.map((t) => ({ text: t, skipped: t === "" }));
      const valid = out.map((o, i) => (o.skipped ? -1 : i)).filter((i) => i >= 0);
      for (let s = 0; s < valid.length; s += CHUNK) {
        const part = valid.slice(s, s + CHUNK);
        const res = await predictBatch(part.map((i) => out[i].text));
        res.forEach((r, k) => Object.assign(out[part[k]], r));
        setProgress(Math.min(valid.length, s + CHUNK) / valid.length);
      }
      setResults(out);
      onResults(out.filter((o) => !o.skipped));
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  const counts = useMemo(() => {
    if (!results) return null;
    const c = { negative: 0, neutral: 0, positive: 0, review: 0, skipped: 0 };
    results.forEach((r) => {
      if (r.skipped) c.skipped++;
      else {
        c[r.sentiment]++;
        if (r.needs_review) c.review++;
      }
    });
    return c;
  }, [results]);

  function download() {
    const head = [...headers, "sentiment", "confidence", "needs_review"];
    const body = rows.slice(0, results.length).map((r, i) => {
      const x = results[i];
      return [...headers.map((_, k) => r[k] ?? ""), x.skipped ? "" : x.sentiment, x.skipped ? "" : x.confidence, x.skipped ? "" : x.needs_review];
    });
    downloadText("sentiment_results.csv", toCSV([head, ...body]));
  }

  const sample = () =>
    downloadText(
      "sample_tweets.csv",
      toCSV([
        ["id", "text"],
        [1, "@united my flight was delayed 5 hours and nobody helped"],
        [2, "@JetBlue thank you for the amazing service!"],
        [3, "@Delta what is the baggage policy for international flights?"],
      ])
    );

  const used = Math.min(rows.length, MAX_ROWS);

  return (
    <section>
      <div className="card">
        <div className="row between wrap">
          <div>
            <div className="field-label">Upload a CSV file of tweets</div>
            <div className="muted small">One tweet per row, with a header row. Up to {MAX_ROWS} rows are analysed.</div>
          </div>
          <button className="btn" onClick={sample}>
            Download sample CSV
          </button>
        </div>
        <input type="file" accept=".csv,text/csv" onChange={onFile} className="file" />

        {rows.length > 0 && (
          <div className="row wrap gap">
            <div>
              <label className="field-label" htmlFor="col">
                Column with the tweet text
              </label>
              <select id="col" value={column} onChange={(e) => setColumn(Number(e.target.value))}>
                {headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h || `Column ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="muted small">
              {fileName}: {rows.length} rows{rows.length > MAX_ROWS ? ` (first ${MAX_ROWS} will be used)` : ""}
            </div>
            <button className="btn primary" disabled={running} onClick={run}>
              {running ? `Analysing... ${Math.round(progress * 100)}%` : `Analyse ${used} tweets`}
            </button>
          </div>
        )}
        {running && (
          <div className="progress">
            <div style={{ width: `${progress * 100}%` }} />
          </div>
        )}
        {error && <div className="notice error">{error}</div>}
      </div>

      {results && counts && (
        <div className="card">
          <div className="row between wrap">
            <div className="stats">
              {CLASSES.map((c) => (
                <div className="stat" key={c} style={{ borderColor: META[c].color }}>
                  <div className="stat-num" style={{ color: META[c].color }}>
                    {counts[c]}
                  </div>
                  <div className="muted small">{META[c].label}</div>
                </div>
              ))}
              <div className="stat">
                <div className="stat-num">{counts.review}</div>
                <div className="muted small">Need review</div>
              </div>
            </div>
            <button className="btn primary" onClick={download}>
              Download results CSV
            </button>
          </div>
          {counts.skipped > 0 && <div className="muted small">{counts.skipped} empty rows were skipped.</div>}

          <ResultsTable rows={results.map((r) => ({ ...r, airline: detectAirline(r.text) }))} showAirline />
        </div>
      )}
    </section>
  );
}
