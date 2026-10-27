import { predictBatch } from "./api.js";

export const MAX_WORDS = 60;

// Removes one word at a time and measures how much the probability of the predicted class drops.
// A big positive number means that word pushed the model towards its answer.
export async function explainWords(text, result) {
  const all = text.trim().split(/\s+/);
  const words = all.slice(0, MAX_WORDS);
  if (words.length < 2) return null;
  const variants = words.map((_, i) => words.filter((__, j) => j !== i).join(" "));
  const res = await predictBatch(variants);
  const k = result.sentiment;
  return {
    truncated: all.length > MAX_WORDS,
    words: words.map((word, i) => ({ word, impact: result.probabilities[k] - res[i].probabilities[k] })),
  };
}
