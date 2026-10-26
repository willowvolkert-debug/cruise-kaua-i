import React from "react";
import useImpactStats from "@/lib/useImpactStats";

export default function DriverEarningsBanner() {
  const stats = useImpactStats();
  if (!stats) return null;
  const amount = Math.round(stats.driverEarnings).toLocaleString();
  return (
    <p className="text-sm font-semibold text-primary -mt-3">
      ${amount} has been provided to local drivers when using cruise
    </p>
  );
}