import React from "react";
import useImpactStats from "@/lib/useImpactStats";

export default function DriverEarningsBanner({ className = "text-sm font-semibold text-primary -mt-3" }) {
  const stats = useImpactStats();
  if (!stats) return null;
  const amount = Math.round(stats.driverEarnings).toLocaleString();
  return (
    <p className={className}>
      ${amount} has been provided to local drivers when using cruise
    </p>
  );
}