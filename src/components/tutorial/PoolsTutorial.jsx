import React from "react";

const Block = ({ emoji, title, lines }) => (
  <div className="bg-muted border border-border rounded-2xl p-4 space-y-2">
    <p className="font-bold text-foreground">{emoji} {title}</p>
    <ul className="space-y-1.5">
      {lines.map((l) => (
        <li key={l} className="text-sm text-foreground">• {l}</li>
      ))}
    </ul>
  </div>
);

export default function PoolsTutorial() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="cruise-head text-3xl text-secondary leading-tight">schoolpool & partypool 🚗</h1>
        <p className="text-muted-foreground text-sm mt-1">find them under the “carpool” button on Home (blue skies)</p>
      </div>
      <Block
        emoji="🎒"
        title="schoolpool"
        lines={[
          "Search for your school, then enter the password your school gives parents.",
          "School not listed? Tap “register a school” in the top right.",
          "Inside, get a ride, post a ride, check your inbox and confirmed rides to share school runs with other parents.",
        ]}
      />
      <Block
        emoji="🎉"
        title="partypool"
        lines={[
          "Events on your island show up automatically. Tap “register an event” to add one.",
          "Tap an event to find a safe ride home or offer a sober ride.",
          "Drivers pledge to stay sober when they offer a ride home.",
        ]}
      />
      <p className="text-xs text-muted-foreground text-center italic">Tap the ? on either page anytime for a refresher.</p>
    </div>
  );
}