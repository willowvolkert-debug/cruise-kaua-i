import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getIsland } from "@/lib/island";

export default function useImpactStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let alive = true;
    base44.functions
      .invoke("getImpactStats", { island: getIsland() })
      .then((res) => alive && setStats(res.data))
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return stats;
}
