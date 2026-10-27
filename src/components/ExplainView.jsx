import { useState } from "react";
import { explainWords, MAX_WORDS } from "../explain.js";
import { META } from "../constants.js";

const MIN_EFFECT = 0.02;

export default function ExplainView({ text, result }) {
  const [state, setState] = useState({ status: "idle" });

  async function run() {
    setState({ status: "loading" });
    try {
      const out = await explainWords(text, result);
      setState(out ? { status: "done", ...out } : { status: "short" });
    } catch (e) {
      setState({ status: "error", message: e.message });
    }
  }

  const m = META[result.sentiment];

  return (
    <div className="card">
      <div className="row between wrap" style={{ marginTop: 0 }}>
        <div>
          <div className="field-label">Why this result?</div>
          <div className="muted small">Removes each word in turn and checks how much the model's answer changes.</div>
        </div>
        <button className="btn" onClick={run} disabled={state.status === "loading"}>
          {state.status === "loading" ? "Explaining..." : state.status === "done" ? "Explain again" : "Explain this result"}
        </button>
      </div>

      {state.status === "short" && <div className="notice">This tweet is too short to explain (at least 2 words are needed).</div>}
      {state.status === "error" && <div className="notice error">{state.message}</div>}

      {state.status === "done" && (() => {
        const maxAbs = Math.max(0.05, ...state.words.map((w) => Math.abs(w.impact)));
        const support = [...state.words].filter((w) => w.impact >= MIN_EFFECT).sort((a, b) => b.impact - a.impact).slice(0, 3);
        const against = [...state.words].filter((w) => w.impact <= -MIN_EFFECT).sort((a, b) => a.impact - b.impact).slice(0, 2);
        return (
          <>
            <div className="explain-words" data-testid="explain-words">
              {state.words.map((w, i) => {
                const pts = Math.round(w.impact * 100);
                const strong = Math.round((Math.abs(w.impact) / maxAbs) * 70);
                let cls = "w";
                let style;
                if (w.impact >= MIN_EFFECT) {
                  cls = "w for";
                  style = { background: `color-mix(in srgb, ${m.color} ${Math.max(18, strong)}%, transparent)` };
                } else if (w.impact <= -MIN_EFFECT) cls = "w against";
                return (
                  <span key={i} className={cls} style={style} title={`Removing "${w.word}" changes the ${m.label} probability by ${pts > 0 ? "-" : "+"}${Math.abs(pts)} points`}>
                    {w.word}
                  </span>
                );
              })}
            </div>
            <div className="legend small muted">
              <span className="w for" style={{ background: `color-mix(in srgb, ${m.color} 45%, transparent)` }}>coloured</span> supports "{m.label}"
              <span className="w against">striped</span> pushes the other way. Hover a word for the exact change.
            </div>
            {support.length > 0 && (
              <div className="small">
                <b>Strongest evidence for {m.label}:</b> {support.map((w) => `"${w.word}" (${Math.round(w.impact * 100)} points)`).join(", ")}
              </div>
            )}
            {against.length > 0 && (
              <div className="small">
                <b>Pushing against it:</b> {against.map((w) => `"${w.word}" (${Math.round(Math.abs(w.impact) * 100)} points)`).join(", ")}
              </div>
            )}
            {support.length === 0 && against.length === 0 && <div className="small muted">No single word changes the result much. The meaning comes from the words together.</div>}
            <div className="muted small">
              A rough guide only: words work together (for example "not" plus "helpful"), and the model reads the whole sentence.
              {state.truncated ? ` Only the first ${MAX_WORDS} words were checked.` : ""}
            </div>
          </>
        );
      })()}
    </div>
  );
}
