import React from "react";

const POOLS = [
  {
    name: "Schoolpool",
    text: "Parents and guardians at the same school share the drive. Join your school's group, post or request rides to and from campus, and keep the morning and afternoon runs off the road.",
  },
  {
    name: "Partypool",
    text: "Heading to a luau, concert or birthday? Join an event's group to find a ride there and a sober ride home, so everyone gets back safe.",
  },
  {
    name: "Foodpool",
    text: "Need a meal or groceries picked up? Request a delivery and let a driver already heading your way grab it for you, for a small tip.",
  },
];

export default function PoolsSection() {
  return (
    <section className="bg-[#F1EDE1] px-6 py-16 md:py-20">
      <div className="max-w-3xl mx-auto space-y-8 text-left">
        {POOLS.map((p) => (
          <div key={p.name}>
            <h3 className="cruise-head text-[#2b1a1a] text-4xl md:text-5xl mb-2">{p.name}</h3>
            <p className="cruise-body text-[#2b1a1a] text-xl md:text-2xl leading-snug">{p.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}