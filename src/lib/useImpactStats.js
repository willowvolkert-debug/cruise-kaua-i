import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getIsland } from "@/lib/island";

const cache = {};

const readCache = (island) => {
  if (cache[island]) return cache[island];
  try {
    const raw = sessionStorage.getItem(`impact_${island}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export default function useImpactStats() {
  const island = getIsland();
  const [stats, setStats] = useState(() => readCache(island));
  useEffect(() => {
    let alive = true;
    base44.functions
      .invoke("getImpactStats", { island })
      .then((res) => {
        cache[island] = res.data;
        try { sessionStorage.setItem(`impact_${island}`, JSON.stringify(res.data)); } catch {}
        if (alive) setStats(res.data);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [island]);
  return stats;
}