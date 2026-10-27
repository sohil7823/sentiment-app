import { useEffect, useState } from "react";

function read(key, initial) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return initial;
    const value = JSON.parse(raw);
    return Array.isArray(value) === Array.isArray(initial) && typeof value === typeof initial ? value : initial;
  } catch {
    return initial;
  }
}

// Like useState, but the value is also kept in the browser (localStorage). Never throws.
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => read(key, initial));
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage blocked or full: the app still works, it just will not remember */
    }
  }, [key, value]);
  return [value, setValue];
}
