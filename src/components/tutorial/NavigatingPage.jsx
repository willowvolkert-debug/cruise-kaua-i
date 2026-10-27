import React from "react";

export default function NavigatingPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="cruise-head text-3xl text-secondary leading-tight">getting around 🧭</h1>
        <p className="text-muted-foreground text-sm mt-1">three ways to backtrack</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-3 bg-muted rounded-2xl px-4 py-3">
          <span className="text-lg shrink-0">⬅️</span>
          <p className="text-sm text-foreground">Tap the red <strong>back</strong> button to backtrack one page at a time.</p>
        </div>
        <div className="flex items-start gap-3 bg-muted rounded-2xl px-4 py-3">
          <span className="text-lg shrink-0">👉</span>
          <p className="text-sm text-foreground"><strong>Slide right</strong> from the left edge of your screen to go back.</p>
        </div>
      </div>

      <blockquote className="border-l-8 border-[#4F8FD3] pl-4 py-2">
        <p className="cruise-body text-[#4F8FD3] text-3xl leading-tight">
          "Tap our logo at the top of the screen at any time to jump straight back to the home page."
        </p>
      </blockquote>
    </div>
  );
}