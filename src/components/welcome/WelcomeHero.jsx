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

      {/* Illustration: feathered edges so it blends into the page */}
      <div className="relative max-w-3xl mx-auto mt-4">
        <img
          src={ISLAND_TRUCK_URL}
          alt="Cruise truck with surfboards driving along the coast"
          style={{ WebkitMaskImage: "radial-gradient(ellipse 46% 40% at 50% 50%, #000 62%, transparent 100%)", maskImage: "radial-gradient(ellipse 46% 40% at 50% 50%, #000 62%, transparent 100%)" }}
          className="w-full -my-4 md:-my-10 select-none mix-blend-multiply" />
      </div>
    </header>
  );
}