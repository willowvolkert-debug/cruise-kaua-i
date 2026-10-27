import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const DONATE_URL = "https://www.gofundme.com/f/support-cruise-hawaiis-community-carpool-launch";

const sections = [
  { emoji: "💬", label: "forum", desc: "Share stories, updates, and feedback in an open community space.", to: "/communityforum" },
  { emoji: "📸", label: "instagram", desc: "See our latest posts from the Cruise Hawaiʻi Instagram feed.", to: "/communityinstagram" },
  { emoji: "💛", label: "donate", desc: "Support Cruise Hawaiʻi's community carpool launch on GoFundMe.", href: DONATE_URL },
  { emoji: "🌴", label: "visitor guide", desc: "How to visit Kauaʻi responsibly, plus authentic ways to give back — tours, food, and volunteering.", to: "/communityvisitorguide" },
  { emoji: "💼", label: "jobs", desc: "We're hiring! Join our team and help shape a community-powered platform for good.", to: "/communityjobs" },
];

const rowClass = "w-full flex items-center gap-5 py-5 border-b-2 border-gray-200 text-left select-none group";

function Row({ emoji, label, desc }) {
  return (
    <>
      <span className="text-4xl shrink-0">{emoji}</span>
      <div className="flex-1">
        <p className="cruise-head tracking-widest text-2xl text-secondary">{label}</p>
        <p className="text-gray-700 text-lg mt-0.5">{desc}</p>
      </div>
      <ChevronLeft className="w-6 h-6 text-gray-400 rotate-180 shrink-0" />
    </>
  );
}

export default function Community() {
  return (
    <div className="p-4 md:p-8 bg-white overflow-x-hidden min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-5">
          <h1 className="cruise-head tracking-widest text-4xl text-secondary leading-none">community</h1>
          <p className="text-gray-900 text-lg mt-1 leading-relaxed">
            Stories, updates, and photos from the Cruise Hawaiʻi community. Tap a card below to explore.
          </p>
        </div>
        <div>
          {sections.map(({ href, to, ...rest }) =>
            href ? (
              <a key={rest.label} href={href} target="_blank" rel="noopener noreferrer" className={rowClass}>
                <Row {...rest} />
              </a>
            ) : (
              <Link key={rest.label} to={to} className={rowClass}>
                <Row {...rest} />
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}