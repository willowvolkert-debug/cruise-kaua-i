import React from "react";

export default function MissionSlide() {
  return (
    <section className="bg-[#EDF2E4] px-6 py-20 md:py-28 text-center">
      <div className="max-w-4xl mx-auto">
        <p className="cruise-body text-[#C64D50] text-xl tracking-widest mb-4">OUR MISSION</p>
        <h2 className="cruise-head text-[#2b1a1a] text-4xl md:text-6xl leading-tight">
          Reduce traffic, save money, build community.
        </h2>
        <p className="cruise-body mt-8 inline-block bg-[#E8A91C] text-[#2b1a1a] text-2xl md:text-3xl px-6 py-2 rounded-full -rotate-1 border-2 border-[#2b1a1a]">
          halve your vehicle costs every year by joining Cruise
        </p>
      </div>
    </section>
  );
}