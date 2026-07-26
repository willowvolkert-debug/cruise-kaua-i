import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const JOBS_EMAIL = "cruisekauai@gmail.com";

const POSITIONS = [
  {
    title: "Community Engagement Coordinator — Part Time",
    rate: "$27/hour · 10–15 hours/week",
    body:
      "Cruise Kauaʻi is looking for a passionate, community-rooted Kauaʻi resident to help us grow. You'll organize and facilitate community listening sessions across the island, manage our partnerships with local ʻāina organizations and schools, and coordinate the logistics of our kūpuna rides program. This role is about relationships — showing up, listening, and making sure Cruise Kauaʻi reflects the real needs of our community.",
    details:
      "Experience in community organizing, nonprofit work, or local outreach preferred. Must be based on Kauaʻi and deeply familiar with the community.",
    apply: "Email cruisekauai@gmail.com with an intro about yourself and why this work matters to you.",
  },
  {
    title: "Social Media & Storytelling Coordinator — Part Time",
    rate: "$30/hour · approximately 10 hours/week",
    body:
      "Cruise Kauaʻi is looking for a creative, community-minded Kauaʻi resident to tell the story of transportation on our island — and the people working together to change it. You'll produce a monthly interview series, manage our Instagram, and create content that is honest, warm, and rooted in real Kauaʻi voices.",
    details:
      "Experience in video production, photography, or social media content creation preferred. Must be based on Kauaʻi and deeply familiar with the community.",
    apply: "Email cruisekauai@gmail.com with an intro and links to any past work.",
  },
];

export default function CommunityJobs() {
  return (
    <div className="p-3 md:p-8 bg-white overflow-x-hidden min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-5">
          <Link to="/community" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors mb-3">
            <ChevronLeft className="w-4 h-4" />
            back to community
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary">We're hiring! 🌺🚗✨</h1>
          <p className="text-gray-600 text-sm mt-3 leading-relaxed">
            Cruise Kauaʻi is growing! If you want to help shape this platform into a community-powered tool for good,
            please send us a cover letter and resume. If none of the position descriptions fit your skills or interests,
            but you're still interested in working with us, still send us an email with your interests in this platform
            and how you'd like to be involved.
          </p>
        </div>

        <div className="space-y-5">
          {POSITIONS.map((p) => (
            <div key={p.title} className="p-5 md:p-6 rounded-3xl border-2 border-gray-200 bg-gray-50">
              <h2 className="text-lg md:text-xl font-bold text-secondary">{p.title}</h2>
              <p className="text-sm font-medium text-primary mt-1">{p.rate}</p>
              <p className="text-gray-700 text-sm mt-3 leading-relaxed">{p.body}</p>
              <p className="text-gray-600 text-sm mt-3 leading-relaxed">{p.details}</p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">{p.apply}</p>
                <a
                  href={`mailto:${JOBS_EMAIL}`}
                  className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-primary hover:underline"
                >
                  {JOBS_EMAIL} ↗
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-5 rounded-3xl border-2 border-primary/30 bg-primary/5 text-center">
          <p className="text-sm text-gray-700 leading-relaxed">
            Don't see a role that fits? We still want to hear from you. 🌿
          </p>
          <a
            href={`mailto:${JOBS_EMAIL}`}
            className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-primary hover:underline"
          >
            Email us at {JOBS_EMAIL} ↗
          </a>
        </div>
      </div>
    </div>
  );
}