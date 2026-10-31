import React from "react";
import useImpactStats from "@/lib/useImpactStats";
import { ArrowRight } from "lucide-react";

const reasons = [
  { icon: "🚗", title: "fewer cars, less traffic", desc: "Neighbors share seats on trips they're already making." },
  { icon: "💸", title: "save money", desc: "Rides are affordable ($5–$30) and drivers cover their gas." },
  { icon: "🤙", title: "build community", desc: "Meet locals, share road alerts, and help each other out." },
];

export default function WelcomeIntroCard({ onContinue }) {
  const stats = useImpactStats();
  return (
    <div className="w-full max-w-sm mx-auto bg-card rounded-3xl shadow-xl overflow-hidden border border-border">
      <div className="px-6 pt-10 pb-6 text-center text-white bg-primary">
        <div className="text-4xl mb-2">🤙</div>
        <h1 className="cruise-head text-4xl text-white">welcome to cruise</h1>
        <p className="text-white/90 text-base mt-1">neighbors sharing rides across the islands.</p>
      </div>
      <div className="px-6 py-6 space-y-5">
        <p className="text-foreground text-base leading-relaxed text-center">
          Cruise connects drivers with open seats to riders heading the same way, so we all spend less, drive less, and know our community better.
        </p>
        {stats && (
          <div className="text-center bg-muted rounded-2xl p-4">
            <p className="font-heading text-4xl text-primary leading-none">{stats.carsOffRoad.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">cars off the road thanks to our community</p>
          </div>
        )}
        <div className="space-y-3">
          {reasons.map((r) => (
            <div key={r.title} className="flex items-start gap-3">
              <span className="text-2xl shrink-0">{r.icon}</span>
              <div>
                <p className="font-bold text-secondary text-sm">{r.title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onContinue}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-full py-3.5 text-base flex items-center justify-center gap-1.5"
        >
          let's go <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}