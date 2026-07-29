import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const JOBS_EMAIL = "cruisekauai@gmail.com";

export default function JobThemeAccordion({ theme, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-3xl border-2 border-gray-200 bg-gray-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-5 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0">{theme.icon}</span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-secondary">{theme.name}</h2>
            <p className="text-xs text-gray-500">
              {theme.roles.length} role{theme.roles.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4">
          {theme.roles.map((r) => (
            <div
              key={r.title}
              className="p-4 rounded-2xl bg-white border border-gray-200"
            >
              <h3 className="text-base font-bold text-secondary">{r.title}</h3>
              {r.rate && (
                <p className="text-sm font-medium text-primary mt-1">{r.rate}</p>
              )}
              {r.description && (
                <p className="text-gray-700 text-sm mt-2 leading-relaxed">
                  {r.description}
                </p>
              )}
              {r.skills && (
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                  <span className="font-semibold text-secondary">Skills needed: </span>
                  {r.skills}
                </p>
              )}
              {r.experience && (
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                  <span className="font-semibold text-secondary">Experience: </span>
                  {r.experience}
                </p>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">{r.apply}</p>
                <a
                  href={`mailto:${JOBS_EMAIL}`}
                  className="inline-flex items-center gap-1 mt-1 text-sm font-semibold text-primary hover:underline"
                >
                  {JOBS_EMAIL} ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}