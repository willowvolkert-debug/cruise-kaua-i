import React from "react";
import useImpactStats from "@/lib/useImpactStats";

export default function ImpactCard({ user }) {
  const stats = useImpactStats();
  if (!stats || !user) return null;
  const me = stats.me || { carsRemoved: 0, moneyToCommunity: 0, conversations: 0 };
  const items = [
    { value: stats.carsOffRoad.toLocaleString(), label: "cars off the road now that you signed up" },
    { value: me.carsRemoved.toLocaleString(), label: "cars you helped remove from the road" },
    { value: `$${Math.round(me.moneyToCommunity).toLocaleString()}`, label: "poured into the community through your rides" },
    { value: me.conversations.toLocaleString(), label: "new conversations" },
  ];
  return (
    <div className="mb-5 p-4 rounded-3xl bg-card border border-border">
      <p className="cruise-head text-2xl text-secondary mb-3">your impact</p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((i) => (
          <div key={i.label}>
            <p className="font-heading text-3xl text-primary leading-none">{i.value}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">{i.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}