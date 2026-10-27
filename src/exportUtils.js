import { downloadText, toCSV } from "./csv.js";

export function exportHistoryCSV(history, reviews, filename = "tweet_sentiment_history.csv") {
  const head = ["time", "tweet", "airline", "model_sentiment", "confidence", "needs_review", "human_label"];
  const rows = history.map((h) => [h.time || "", h.text, h.airline || "", h.sentiment, h.confidence, h.needs_review, reviews[h.id] || ""]);
  downloadText(filename, toCSV([head, ...rows]));
}
