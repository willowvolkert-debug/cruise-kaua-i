import React from "react";
import { TRUCK_URL } from "@/components/welcome/WelcomeHero";

export default function TruckLoader({ label = "", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 select-none ${className}`}>
      <div className="relative w-40 h-24 flex items-end justify-center">
        <span className="truck-puff truck-puff-1" />
        <span className="truck-puff truck-puff-2" />
        <span className="truck-puff truck-puff-3" />
        <img src={TRUCK_URL} alt="Loading" className="truck-rev w-32 object-contain" />
      </div>
      {label && <p className="cruise-head tracking-widest text-xl text-secondary mt-2">{label}</p>}
    </div>
  );
}