import { useState, useEffect } from "react";

const KEY = "cruise_skies";
const EVENT = "cruise-skies-change";

export function getSkies() {
  return localStorage.getItem(KEY) === "grey" ? "grey" : "blue";
}

export function toggleSkies() {
  localStorage.setItem(KEY, getSkies() === "grey" ? "blue" : "grey");
  window.dispatchEvent(new Event(EVENT));
}

export function useSkies() {
  const [skies, setSkies] = useState(getSkies());
  useEffect(() => {
    const sync = () => setSkies(getSkies());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return skies;
}