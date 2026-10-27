import { useMemo, useState } from "react";
import { predictBatch } from "../api.js";
import { APP_NAME } from "../brand.js";
import { CLASSES, DEMO_TWEETS, META } from "../constants.js";
import { exportHistoryCSV } from "../exportUtils.js";
import AirlineChart from "./AirlineChart.jsx";
import ConfirmButton from "./ConfirmButton.jsx";

function RollingChart({ series, threshold }) {
  const W = 640;
  const H = 210;
  const pad = { l: 38, r: 12, t: 12, b: 26 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = (i) => pad.l + (series.length <= 1 ? 0 : (i / (series.length - 1)) * iw);
  const y = (v) => pad.t + ih - (v / 100) * ih;
  const pts = series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Rolling share of negative tweets">
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="grid" />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="tick">
            {t}%
          </text>
        </g>
      ))}
      <line x1={pad.l} x2={W - pad.r} y1={y(threshold)} y2={y(threshold)} className="threshold" />
      <text x={W - pad.r} y={y(threshold) - 4} textAnchor="end" className="tick danger">
        alert {threshold}%
      </text>
      <polyline points={pts} className="line" />
      <text x={pad.l} y={H - 6} className="tick">
        oldest
      </text>
      <text x={W - pad.r} y={H - 6} textAnchor="end" className="tick">
        latest
      </text>
    </svg>
  );
}

export default function Dashboard({ history, reviews, onResults, onClear }) {
  const [windowSize, setWindowSize] = useState(10);
  const [threshold, setThreshold] = useState(60);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const total = history.length;
  const counts = useMemo(() => {
    const c = { negative: 0, neutral: 0, positive: 0 };
    history.forEach((h) => (c[h.sentiment] += 1));
    return c;
  }, [history]);

  const series = useMemo(() => {
    const out = [];
    for (let i = windowSize - 1; i < history.length; i++) {
      const slice = history.slice(i - windowSize + 1, i + 1);
      out.push((slice.filter((h) => h.sentiment === "negative").length / windowSize) * 100);
    }
    return out;
  }, [history, windowSize]);

  const latest = series.length ? series[series.length - 1] : null;
  const alert = latest !== null && latest > threshold;

  async function demo() {
    setRunning(true);
    setError("");
    try {
      onResults(await predictBatch(DEMO_TWEETS));
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <section>
      <div className="print-only print-head">
        <h2>{APP_NAME}: sentiment report</h2>
        <div>
          Created on {new Date().toLocaleString()}. {total} tweets analysed in this browser.
        </div>
      </div>

      <div className="card">
        <div className="row between wrap" style={{ marginTop: 0 }}>
          <div>
            <div className="field-label">Live sentiment monitor</div>
            <div className="muted small">
              Everything you analyse on the other tabs is collected here (and kept in this browser). Raises an alert when negative tweets spike.
            </div>
          </div>
          <div className="row gap wrap no-print" style={{ marginTop: 0 }}>
            <button className="btn" disabled={running} onClick={demo}>
              {running ? "Running demo..." : "Run demo stream"}
            </button>
            <button className="btn" disabled={!total} onClick={() => exportHistoryCSV(history, reviews, "dashboard_report.csv")}>
              Download CSV
            </button>
            <button className="btn" disabled={!total} onClick={() => window.print()}>
              Print / save as PDF
            </button>
            <ConfirmButton label="Clear" disabled={!total} onConfirm={onClear} />
          </div>
        </div>
        {error && <div className="notice error">{error}</div>}
      </div>

      {total === 0 ? (
        <div className="card empty">No tweets analysed yet. Analyse a tweet, upload a CSV or run the demo stream.</div>
      ) : (
        <>
          <div className="grid-2">
            <div className="card">
              <div className="field-label">Sentiment mix ({total} tweets)</div>
              <div className="bars">
                {CLASSES.map((c) => (
                  <div className="bar-row" key={c}>
                    <span className="bar-name">{META[c].label}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(counts[c] / total) * 100}%`, background: META[c].color }} />
                    </div>
                    <span className="bar-val">
                      {counts[c]} ({Math.round((counts[c] / total) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="field-label">Alert settings</div>
              <div className="sliders no-print">
                <label>
                  Window: last {windowSize} tweets
                  <input type="range" min="5" max="50" value={windowSize} onChange={(e) => setWindowSize(Number(e.target.value))} />
                </label>
                <label>
                  Alert when negative share is above {threshold}%
                  <input type="range" min="30" max="95" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
                </label>
              </div>
              <div className="print-only small">Window: last {windowSize} tweets. Alert above {threshold}% negative.</div>
              {latest === null ? (
                <div className="notice">Need at least {windowSize} tweets to calculate the rolling share.</div>
              ) : alert ? (
                <div className="notice error">
                  Spike alert: {Math.round(latest)}% of the last {windowSize} tweets are negative.
                </div>
              ) : (
                <div className="notice ok">
                  Normal: {Math.round(latest)}% of the last {windowSize} tweets are negative.
                </div>
              )}
            </div>
          </div>

          <AirlineChart history={history} />

          <div className="card">
            <div className="field-label">Rolling share of negative tweets</div>
            {series.length > 1 ? (
              <RollingChart series={series} threshold={threshold} />
            ) : (
              <div className="muted small">The chart appears once there are more than {windowSize} tweets.</div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
