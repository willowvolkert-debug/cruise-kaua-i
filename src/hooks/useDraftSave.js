import { useEffect, useRef } from "react";

/**
 * Saves `data` to localStorage under `key` whenever it changes (debounced).
 * Call `clearDraft(key)` to remove after successful submit.
 */
export function useDraftSave(key, data, debounceMs = 600) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!key || data === null || data === undefined) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        // Storage full or unavailable — silently ignore
      }
    }, debounceMs);
    return () => clearTimeout(timerRef.current);
  }, [key, JSON.stringify(data)]);
}

export function loadDraft(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}