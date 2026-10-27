import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Pause, Play } from "lucide-react";

function SummaryView({ onPause, onContinue, continueLabel }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="cruise-head text-3xl text-secondary">blue skies &amp; grey skies</h2>
        <p className="text-muted-foreground text-base mt-1">one network, for normal days and hard days</p>
      </div>

      <div className="rounded-2xl border-2 border-foreground/10 bg-[#4F8FD3]/15 p-4">
        <p className="cruise-head text-xl text-[#2f6aa8]">🌤️ blue skies</p>
        <p className="text-foreground text-base leading-snug mt-1">
          Everyday carpooling. Drivers share seats on trips they're already making, riders get affordable rides from locals.
        </p>
      </div>

      <div className="rounded-2xl border-2 border-foreground/10 bg-[#D0C6C7] p-4">
        <p className="cruise-head text-xl text-primary">⛈️ grey skies</p>
        <p className="text-foreground text-base leading-snug mt-1">
          Community disaster relief. When normal systems are under pressure, the same network connects people, vehicles, supplies and other resources on a map.
        </p>
      </div>

      <p className="text-muted-foreground text-sm text-center">
        Switch anytime with the sky button at the top left of your home page.
      </p>

      <div className="flex flex-col gap-2 pt-1">
        <Button onClick={onContinue} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-5 text-base font-bold select-none">
          {continueLabel} <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
        <Button variant="outline" onClick={onPause} className="w-full rounded-full py-5 text-base font-bold border-2 border-foreground/20 select-none">
          <Pause className="w-4 h-4 mr-1" /> tell me more
        </Button>
      </div>
    </div>
  );
}

function PausedView({ onResume }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <span className="inline-block bg-muted border border-border rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          welcome paused
        </span>
        <h2 className="cruise-head text-3xl text-secondary mt-2">how skies work</h2>
      </div>

      <div className="space-y-3 text-foreground text-base leading-snug">
        <p>
          <span className="font-bold text-[#2f6aa8]">Under blue skies,</span> Cruise connects people who are already driving with people who need rides across the island.
        </p>
        <p>
          <span className="font-bold text-primary">Under grey skies,</span> the same network connects people, vehicles, supplies and other resources when normal systems are under pressure, such as storms, floods or road closures.
        </p>
        <p>
          In grey skies mode your home page becomes a relief map. Red pins are <strong>needs</strong> and blue pins are <strong>resources</strong>.
        </p>
      </div>

      <div className="bg-muted border border-border rounded-2xl p-4 space-y-2 text-base text-foreground">
        <p className="cruise-head text-lg text-secondary">what you can do</p>
        <p>📍 Post a resource or a need with a title, details and a pin on the map</p>
        <p>💬 Message the person behind any post directly</p>
        <p>🔎 Browse the list by all, needs or resources, and filter by area</p>
        <p>🗑️ Take your post down whenever it's no longer needed</p>
      </div>

      <p className="text-muted-foreground text-sm text-center">
        Anyone can view the map. Posting needs an account and a Hawaiʻi ID.
      </p>

      <Button onClick={onResume} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-5 text-base font-bold select-none">
        <Play className="w-4 h-4 mr-1" /> resume welcome
      </Button>
    </div>
  );
}

export default function SkiesCard({ onContinue, continueLabel = "continue" }) {
  const [paused, setPaused] = useState(false);
  return paused
    ? <PausedView onResume={() => setPaused(false)} />
    : <SummaryView onPause={() => setPaused(true)} onContinue={onContinue} continueLabel={continueLabel} />;
}