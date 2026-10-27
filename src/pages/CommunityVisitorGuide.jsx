import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import BackButton from "@/components/BackButton";

const sections = [
  { emoji: "🏝️", label: "how to visit Kauaʻi", desc: "Learn about the Destination Management Action Plan and how to travel to Kauaʻi responsibly.", to: "/communityhowtovisit" },
  { emoji: "🌴", label: "recommendations", desc: "Authentic ways to support & give back to Kauaʻi — tours, food, and volunteering.", to: "/communityrecommendations" },
];

export default function CommunityVisitorGuide() {
  return (
    <div className="p-4 md:p-8 bg-white min-h-screen">
      <div className="max-w-2xl mx-auto">
        <BackButton className="mb-4" />
        <div className="mb-5">
          <h1 className="cruise-head tracking-widest text-4xl text-secondary leading-none">visitor guide</h1>
          <p className="text-gray-900 text-lg mt-1">Everything for visiting Kauaʻi with aloha.</p>
        </div>
        {sections.map(({ emoji, label, desc, to }) => (
          <Link key={label} to={to} className="w-full flex items-center gap-5 py-5 border-b-2 border-gray-200 select-none">
            <span className="text-4xl shrink-0">{emoji}</span>
            <div className="flex-1">
              <p className="cruise-head tracking-widest text-2xl text-secondary">{label}</p>
              <p className="text-gray-700 text-lg mt-0.5">{desc}</p>
            </div>
            <ChevronLeft className="w-6 h-6 text-gray-400 rotate-180 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}