import React from "react";
import BetaHomeCopy from "@/components/beta/BetaHomeCopy";
import BetaComparison from "@/components/beta/BetaComparison";

export default function BetaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 pb-16">
      <BetaHomeCopy />
      <BetaComparison />

      <section className="space-y-2 pb-6">
        <h2 className="text-2xl text-secondary lowercase tracking-widest text-center">a worked price example (ours)</h2>
        <div className="bg-card border-2 border-foreground rounded-2xl p-4 text-lg">
          A 15-mile trip at the suggested resident price: $3 + 15 × $0.38 = $8.70 for the seat. Add the $3 flat fee: $11.70. Add 3% card processing: about $12.05 in total, plus $1.50 once on a first booking for the ID check. The driver receives the $8.70. (Willow: we add the same trip priced in Uber, Lyft and a taxi, each with a dated screenshot, before this goes public. We will not guess their prices.)
        </div>
      </section>
    </div>
  );
}