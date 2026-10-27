import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function Community() {
  const sections = [
    { emoji: "💬", label: "forum", desc: "Share stories, updates, and feedback in an open community space.", to: "/communityforum" },
    { emoji: "📸", label: "instagram", desc: "See our latest posts from the Cruise Hawaiʻi Instagram feed.", to: "/communityinstagram" },
    { emoji: "🌴", label: "recommendations", desc: "Authentic ways to support & give back to Kauaʻi — tours, food, and volunteering.", to: "/communityrecommendations" },
    { emoji: "🏝️", label: "how to visit Kauaʻi", desc: "Learn about the Destination Management Action Plan and how to travel to Kauaʻi responsibly.", to: "/communityhowtovisit" },
    { emoji: "💼", label: "jobs", desc: "We're hiring! Join our team and help shape a community-powered platform for good.", to: "/communityjobs" },
  ];

  return (
    <div className="p-3 md:p-8 bg-background overflow-x-hidden min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-bold text-secondary">community</h1>
          <p className="text-gray-500 text-sm mt-1 leading-relaxed">
            Stories, updates, and photos from the Cruise Hawaiʻi community. Tap a card below to explore.
          </p>
        </div>
        <div className="space-y-4">
          {sections.map(({ emoji, label, desc, to }) => (
            <Link
              key={label}
              to={to}
              className="w-full flex items-center gap-5 p-5 rounded-3xl border-2 border-gray-200 bg-gray-50 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
            >
              <span className="text-4xl shrink-0">{emoji}</span>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">{label}</p>
                <p className="text-gray-500 text-sm mt-0.5">{desc}</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-primary rotate-180 shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}