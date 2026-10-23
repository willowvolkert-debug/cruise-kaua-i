import React from "react";
import { ISLAND_TRUCK_URL } from "@/components/welcome/WelcomeHero";

export default function GreySkies() {
  return (
    <section className="bg-[#D0C6C7] px-6 py-20 md:py-28">
      <div className="max-w-3xl mx-auto text-center">
        <img src={ISLAND_TRUCK_URL} alt="" className="w-40 md:w-56 mx-auto mb-6 select-none" />
        <h2 className="cruise-head text-[#2b1a1a] text-5xl md:text-6xl mb-6">Grey Skies</h2>
        <p className="cruise-body text-[#2b1a1a] text-2xl md:text-3xl leading-snug mb-8">
          Cruise is a community network built to be useful when things are normal and when they are not.
        </p>
        <div className="cruise-body text-[#2b1a1a] text-xl md:text-2xl leading-snug space-y-5 text-left">
          <p><span className="text-[#4F8FD3] font-bold">Under blue skies,</span> that means connecting people already driving with people who need rides.</p>
          <p><span className="text-[#C64D50] font-bold">Under grey skies,</span> the same network can connect people, vehicles, supplies and other resources when normal systems are under pressure.</p>
          <p>With Cruise, anyone with an account &amp; Hawaiʻi ID can post a resource or need on their island. The map is available for anyone to view and directly contact the account associated with a resource or need. Support the people who need it efficiently and effectively.</p>
        </div>
      </div>
    </section>
  );
}