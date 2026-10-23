import React from "react";
import { Button } from "@/components/ui/button";
import { ISLAND_TRUCK_URL, TRUCK_URL } from "@/components/welcome/WelcomeHero";

const slides = [
  {
    title: "DRIVERS",
    body: "Post the rides you're already taking - to work, to the beach, to the grocery store. You're going there anyway, why not make something from the empty seat?",
    bg: "bg-[#F1EDE1]",
    titleColor: "text-[#C64D50]",
    img: TRUCK_URL,
  },
  {
    title: "RIDERS",
    body: "Get where you need to go, safely and affordably. See rides already available, or post a ride request if none match your route/time.",
    bg: "bg-[#EDF2E4]",
    titleColor: "text-[#4F8FD3]",
    img: ISLAND_TRUCK_URL,
    flip: true,
  },
  {
    title: "TOGETHER",
    body: "More money in locals' pockets, less cars on the road, and more connection.",
    bg: "bg-[#89AF76]",
    titleColor: "text-[#F1EDE1]",
    img: TRUCK_URL,
  },
];

export default function HowItWorks({ onSignUp }) {
  return (
    <div>
      <div className="bg-[#2b1a1a] text-center py-10 px-6">
        <h2 className="cruise-head text-[#F1EDE1] text-5xl md:text-6xl">How It Works</h2>
      </div>
      {slides.map((s) => (
        <section key={s.title} className={`${s.bg} px-6 py-16 md:py-24`}>
          <div className={`max-w-5xl mx-auto flex flex-col ${s.flip ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-8 md:gap-16`}>
            <img src={s.img} alt="" className="w-64 md:w-96 shrink-0 select-none" />
            <div className="text-center md:text-left">
              <h3 className={`cruise-head text-6xl md:text-7xl mb-4 ${s.titleColor}`}>{s.title}</h3>
              <p className="cruise-body text-[#2b1a1a] text-2xl md:text-3xl leading-snug">{s.body}</p>
            </div>
          </div>
        </section>
      ))}
      <div className="bg-[#F1EDE1] py-12 text-center">
        <Button onClick={onSignUp} className="cruise-body text-2xl bg-[#C64D50] hover:bg-[#b0423f] text-[#F1EDE1] rounded-full px-10 py-7 border-2 border-[#2b1a1a] select-none">
          sign up here →
        </Button>
      </div>
    </div>
  );
}