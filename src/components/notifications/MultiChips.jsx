import React from "react";
import { Check } from "lucide-react";

const chip = (on) =>
  `px-3 py-1.5 rounded-full text-sm font-medium border select-none transition-all ${
    on ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
  }`;

/**
 * Multi-select chips with an "all" option.
 * emptyMeansAll: empty array = everything (used for towns). Otherwise "all" selects every option.
 */
export default function MultiChips({ options, value, onChange, emptyMeansAll = false }) {
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const allValues = items.map((i) => i.value);
  const allOn = emptyMeansAll ? value.length === 0 : value.length === allValues.length;

  const toggle = (v) => {
    const next = value.includes(v) ? value.filter((x) => x !== v) : [...value, v];
    onChange(next);
  };
  const toggleAll = () => onChange(emptyMeansAll ? [] : allOn ? [] : allValues);

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={toggleAll} className={chip(allOn)}>
        {allOn && <Check className="w-3 h-3 inline mr-1" />}all
      </button>
      {items.map((i) => {
        const on = !allOn && value.includes(i.value);
        const shown = emptyMeansAll ? on : value.includes(i.value);
        return (
          <button key={i.value} type="button" onClick={() => toggle(i.value)} className={chip(shown)}>
            {shown && <Check className="w-3 h-3 inline mr-1" />}{i.label}
          </button>
        );
      })}
    </div>
  );
}