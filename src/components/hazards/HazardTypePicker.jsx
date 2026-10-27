import React from "react";
import { HAZARD_TYPES } from "./hazardTypes";

export default function HazardTypePicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {HAZARD_TYPES.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 text-center select-none transition-all ${
            value === t.key ? "border-primary bg-primary/10" : "border-border bg-background"
          }`}
        >
          <span className="text-2xl">{t.emoji}</span>
          <span className="text-[11px] leading-tight font-semibold text-foreground">{t.label}</span>
        </button>
      ))}
    </div>
  );
}