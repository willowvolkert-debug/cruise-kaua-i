import React from "react";
import { ISLAND_TRUCK_URL } from "@/components/welcome/WelcomeHero";

const promises = [
  { t: "fair prices, no surge 🚗", d: "Drivers set their own price per seat, inside a cap for the route. You see the full total, fees included, before you pay, and it does not jump when it rains or when everyone leaves at once." },
  { t: "drivers keep the ride money 💚", d: "We charge a small flat fee per booking, never a cut of the fare. The driver is paid the full ride price after the ride." },
  { t: "made here, for here 🌺", d: "Cruise only works in Hawaiʻi. We are building it island by island, starting on Kauaʻi, with the people who live here." },
];

const more = [
  { t: "schoolpool 🎒", d: "Parents share the school run with other parents at the same school." },
  { t: "road alerts 🚧", d: "Neighbours tell each other about closures and hazards, on a map." },
  { t: "grey skies 🌧️", d: "When a storm or flood hits, ask for help or offer it in one place." },
];

function Card({ t, d }) {
  return (
    <div className="bg-card border-2 border-foreground rounded-2xl p-4">
      <h3 className="text-xl text-primary lowercase">{t}</h3>
      <p className="text-lg leading-snug mt-1">{d}</p>
    </div>
  );
}

export default function BetaHomeCopy() {
  return (
    <>
      <section className="text-center pt-4 pb-6">
        <img src={ISLAND_TRUCK_URL} alt="cruise hawaiʻi" className="w-28 h-28 object-contain mx-auto" />
        <h1 className="text-4xl text-primary lowercase mt-2">get around kauaʻi. keep it aloha. 🤙</h1>
        <p className="text-xl mt-3">
          cruise hawaiʻi is a community carpool app made on kauaʻi, for kauaʻi. share a ride with a neighbor, split the gas, skip the surge.
        </p>
      </section>

      <section className="space-y-3 pb-6">
        <h2 className="text-2xl text-secondary lowercase tracking-widest text-center">three promises</h2>
        {promises.map((p) => <Card key={p.t} {...p} />)}
      </section>

      <section className="space-y-3 pb-6">
        <h2 className="text-2xl text-secondary lowercase tracking-widest text-center">more than rides</h2>
        {more.map((p) => <Card key={p.t} {...p} />)}
        <p className="text-lg text-center">
          coming soon: partypool, a safe ride home from events, and foodpool, food deliveries between towns.
        </p>
      </section>

      <section className="space-y-2 pb-6">
        <h2 className="text-2xl text-secondary lowercase tracking-widest text-center">why cruise instead of the big apps</h2>
        <p className="text-lg">
          The big apps are built for every city in the world. We are built for one island. That means a flat fee instead of a share of every fare, no surge pricing, features that only matter here, and a team you can email and who answers. See the full comparison, with sources, below.
        </p>
      </section>

      <section className="space-y-2 pb-6">
        <h2 className="text-2xl text-secondary lowercase tracking-widest text-center">keeping it local</h2>
        <p className="text-lg">
          Our mission is to make getting around Kauaʻi accessible and affordable, cut traffic, and keep more money on the island. Drivers are your neighbours and they keep the whole ride price. (Willow: add a sentence about who owns Cruise and where it is based, once you confirm it.)
        </p>
      </section>
    </>
  );
}