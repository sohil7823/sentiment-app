import { useEffect, useMemo, useRef, useState } from "react";
import { getHealth } from "./api.js";
import { detectAirline } from "./airlines.js";
import { APP_NAME, AUTHOR, PROJECT, TAGLINE } from "./brand.js";
import { usePersistentState } from "./storage.js";
import Analyzer from "./components/Analyzer.jsx";
import BatchUpload from "./components/BatchUpload.jsx";
import Compare from "./components/Compare.jsx";
import Dashboard from "./components/Dashboard.jsx";
import History from "./components/History.jsx";
import Logo from "./components/Logo.jsx";
import ModelCard from "./components/ModelCard.jsx";
import ReviewQueue from "./components/ReviewQueue.jsx";

const THEMES = ["auto", "light", "dark"];
const MAX_HISTORY = 1000;

export default function App() {
  const [tab, setTab] = useState("analyse");
  const [status, setStatus] = useState("checking");
  const [history, setHistory] = usePersistentState("tsm_history", []);
  const [reviews, setReviews] = usePersistentState("tsm_reviews", {});
  const [extraQueue, setExtraQueue] = usePersistentState("tsm_extra_queue", []);
  const [theme, setTheme] = usePersistentState("tsm_theme", "auto");
  const nextId = useRef(Math.max(0, ...history.map((h) => h.id || 0)) + 1);

  useEffect(() => {
    let alive = true;
    getHealth()
      .then((h) => alive && setStatus(h.status === "ok" ? "ready" : "offline"))
      .catch(() => alive && setStatus("offline"));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  const addResults = (items) =>
    setHistory((h) =>
      [
        ...h,
        ...items.map((r) => ({
          id: nextId.current++,
          time: new Date().toISOString(),
          text: r.text,
          airline: detectAirline(r.text),
          sentiment: r.sentiment,
          confidence: r.confidence,
          needs_review: r.needs_review,
        })),
      ].slice(-MAX_HISTORY)
    );

  const setReview = (id, label) =>
    setReviews((prev) => {
      const next = { ...prev };
      if (label) next[id] = label;
      else delete next[id];
      return next;
    });

  const addRandom = (n) => {
    const extra = new Set(extraQueue);
    const pool = history.filter((h) => !h.needs_review && !extra.has(h.id));
    const pick = [...pool].sort(() => Math.random() - 0.5).slice(0, n).map((h) => h.id);
    setExtraQueue((q) => [...q, ...pick]);
  };

  const clearAll = () => {
    setHistory([]);
    setReviews({});
    setExtraQueue([]);
  };

  const pendingCount = useMemo(() => {
    const extra = new Set(extraQueue);
    return history.filter((h) => (h.needs_review || extra.has(h.id)) && !reviews[h.id]).length;
  }, [history, reviews, extraQueue]);

  const TABS = [
    ["analyse", "Analyse"],
    ["compare", "Compare"],
    ["batch", "Batch CSV"],
    ["dashboard", "Dashboard"],
    ["review", pendingCount ? `Review queue (${pendingCount})` : "Review queue"],
    ["history", "History"],
    ["model", "Model card"],
  ];

  const statusText = { checking: "Checking service...", ready: "Model service online", offline: "Service not reachable" }[status];
  const themeLabel = { auto: "Auto", light: "Light", dark: "Dark" }[theme];

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <Logo />
          <div>
            <h1>{APP_NAME}</h1>
            <p className="muted">{TAGLINE}</p>
          </div>
        </div>
        <div className="header-right no-print">
          <button className="theme-btn" onClick={() => setTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length])} title="Switch between automatic, light and dark theme">
            Theme: {themeLabel}
          </button>
          <div className={`status ${status}`}>
            <span className="dot" />
            {statusText}
          </div>
        </div>
      </header>

      <nav className="tabs no-print" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "tab active" : "tab"} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      <main>
        {tab === "analyse" && <Analyzer history={history} onResults={addResults} />}
        {tab === "compare" && <Compare onResults={addResults} />}
        {tab === "batch" && <BatchUpload onResults={addResults} />}
        {tab === "dashboard" && <Dashboard history={history} reviews={reviews} onResults={addResults} onClear={clearAll} />}
        {tab === "review" && (
          <ReviewQueue history={history} reviews={reviews} extraQueue={extraQueue} onReview={setReview} onAddRandom={addRandom} onResetReviews={() => setReviews({})} />
        )}
        {tab === "history" && <History history={history} reviews={reviews} onClear={clearAll} />}
        {tab === "model" && <ModelCard />}
      </main>

      <footer className="footer muted small">
        <div>
          {PROJECT}. Model trained on the Twitter US Airline Sentiment dataset (English tweets, 2015); results can be wrong on sarcasm and mixed sentiment.
        </div>
        {AUTHOR && <div>{AUTHOR}</div>}
      </footer>
    </div>
  );
}
