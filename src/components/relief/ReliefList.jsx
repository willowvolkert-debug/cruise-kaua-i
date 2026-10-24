import React, { useState } from "react";
import { Input } from "@/components/ui/input";

const TABS = ["all", "need", "resource"];

export default function ReliefList({ posts, onSelect }) {
  const [tab, setTab] = useState("all");
  const [area, setArea] = useState("");

  const shown = posts.filter(
    (p) => (tab === "all" || p.kind === tab) && (p.location_text || "").toLowerCase().includes(area.trim().toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 select-none ${tab === t ? "bg-secondary text-primary-foreground border-secondary" : "border-border text-muted-foreground"}`}>
            {t === "all" ? "all" : t + "s"}
          </button>
        ))}
        <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="filter by area" className="flex-1 min-w-0" />
      </div>
      {shown.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">nothing posted here yet</p>}
      {shown.map((p) => (
        <button key={p.id} onClick={() => onSelect(p)} className="w-full text-left p-3 rounded-2xl border border-border bg-card hover:border-primary/50 flex gap-3 items-start select-none">
          <span className={`mt-1.5 w-3 h-3 rounded-full shrink-0 ${p.kind === "need" ? "bg-red-600" : "bg-blue-600"}`} />
          <div className="min-w-0">
            <p className="font-bold leading-tight">{p.title}</p>
            <p className="text-xs text-muted-foreground">{p.location_text} · {p.owner_name}</p>
            {p.details && <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{p.details}</p>}
          </div>
        </button>
      ))}
    </div>
  );
}