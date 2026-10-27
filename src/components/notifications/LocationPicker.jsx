import React from "react";
import { Check } from "lucide-react";
import { SIDE_TOWNS, SIDE_LABELS } from "@/components/notifications/notificationOptions";

const chip = (on, small) =>
  `${small ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"} rounded-full font-medium border select-none transition-all ${
    on ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
  }`;

/** Pick whole sides of the island or individual towns. Empty list = all of Kauaʻi. */
export default function LocationPicker({ value, onChange }) {
  const toggleTown = (t) => onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);
  const toggleSide = (side) => {
    const towns = SIDE_TOWNS[side];
    const full = towns.every((t) => value.includes(t));
    onChange(full ? value.filter((t) => !towns.includes(t)) : [...new Set([...value, ...towns])]);
  };

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => onChange([])} className={chip(value.length === 0)}>
        {value.length === 0 && <Check className="w-3 h-3 inline mr-1" />}all of kauaʻi
      </button>
      {Object.entries(SIDE_TOWNS).map(([side, towns]) => {
        const full = towns.every((t) => value.includes(t));
        return (
          <div key={side} className="space-y-1.5">
            <button type="button" onClick={() => toggleSide(side)} className={chip(full)}>
              {full && <Check className="w-3 h-3 inline mr-1" />}{SIDE_LABELS[side]}
            </button>
            <div className="flex flex-wrap gap-1.5 pl-1">
              {towns.map((t) => (
                <button key={t} type="button" onClick={() => toggleTown(t)} className={chip(value.includes(t), true)}>
                  {value.includes(t) && <Check className="w-3 h-3 inline mr-1" />}{t}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}