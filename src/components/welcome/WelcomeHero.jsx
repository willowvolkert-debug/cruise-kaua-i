import React from "react";
import { Button } from "@/components/ui/button";

export const TRUCK_URL = "https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/35009d120_CruiseKauai_Logo_Truck.png";
export const ISLAND_TRUCK_URL = "https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/acd55cd1d_CruiseKauai_Logo_IslandTruck.png";

export default function WelcomeHero({ onLogin, onSignUp, onExplore }) {
  return (
    <header className="relative bg-[#F1EDE1] overflow-hidden px-6 pt-16 pb-0 text-center">
      <button
        onClick={onLogin}
        className="cruise-body absolute top-4 right-4 z-20 bg-[#EDF2E4] hover:bg-[#89AF76]/40 text-[#2b1a1a] text-lg px-5 py-1.5 rounded-full border-2 border-[#2b1a1a] transition-colors select-none">
        log in →
      </button>

      <div className="relative z-10 max-w-3xl mx-auto">
        <h1 className="cruise-head text-[#2b1a1a] text-6xl md:text-8xl leading-[0.9] -rotate-2 tracking-wide">
          Cruise<br /><span className="text-[#C64D50]">Hawaiʻi</span>
        </h1>
        <p className="cruise-body text-[#2b1a1a] text-2xl md:text-3xl mt-5">
          a community carpooling network for hawaiʻi
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
          <Button onClick={onSignUp} size="lg" className="cruise-body text-xl bg-[#C64D50] hover:bg-[#b0423f] text-[#F1EDE1] rounded-full px-8 border-2 border-[#2b1a1a] select-none">
            Join the Community
          </Button>
          <Button onClick={onExplore} size="lg" variant="outline" className="cruise-body text-xl bg-transparent text-[#2b1a1a] hover:bg-[#EDF2E4] rounded-full px-8 border-2 border-[#2b1a1a] select-none">
            Browse Rides →
          </Button>
        </div>
      </div>

      {/* Scene: sun, mountains, road, truck */}
      <div className="relative max-w-4xl mx-auto mt-6 h-56 md:h-80">
        <svg viewBox="0 0 800 300" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYEnd meet" aria-hidden="true">
          <g stroke="#E8A91C" strokeWidth="10" strokeLinecap="round">
            <line x1="130" y1="30" x2="130" y2="48" /><line x1="60" y1="60" x2="74" y2="72" />
            <line x1="200" y1="60" x2="186" y2="72" /><line x1="45" y1="120" x2="63" y2="120" />
            <line x1="215" y1="120" x2="197" y2="120" />
          </g>
          <circle cx="130" cy="120" r="42" fill="#E8A91C" />
          <path d="M60 250 L230 110 L300 170 L420 70 L620 250 Z" fill="#89AF76" />
          <path d="M420 70 L390 140 M420 70 L450 150 M230 110 L215 180 M230 110 L260 170" stroke="#EDF2E4" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M560 250 Q620 170 700 200 Q760 220 790 250 Z" fill="#6f9660" />
          <rect x="0" y="250" width="800" height="50" fill="#2b2b2b" />
          <g stroke="#F1EDE1" strokeWidth="5" strokeLinecap="round">
            <line x1="40" y1="275" x2="120" y2="275" /><line x1="220" y1="275" x2="300" y2="275" />
            <line x1="400" y1="275" x2="480" y2="275" /><line x1="580" y1="275" x2="660" y2="275" />
          </g>
        </svg>
        <img
          src={TRUCK_URL}
          alt="Cruise truck with surfboards"
          className="cruise-truck absolute left-1/2 -translate-x-1/2 bottom-0 w-64 md:w-[28rem] translate-y-4 md:translate-y-8 select-none" />
      </div>
    </header>
  );
}