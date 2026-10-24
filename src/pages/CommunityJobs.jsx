import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import JobThemeAccordion from "@/components/jobs/JobThemeAccordion";

const JOBS_EMAIL = "cruisekauai@gmail.com";
const APPLY_GENERIC =
  "Email cruisekauai@gmail.com with a cover letter and resume telling us why this work matters to you.";

const THEMES = [
  {
    icon: "🧭",
    name: "Leadership & Executive",
    roles: [
      {
        title: "Co-Director (Business & Operations)",
        description:
          "Partners with the Founder & Program Director to lead Cruise Hawaiʻi through its pilot phase. Owns business strategy, operational execution, financial oversight, and organizational scaling as the company grows from a Kauaʻi startup into a statewide operation.",
        skills:
          "Strategic planning, P&L management, team building, government contract management, fundraising/investor relations, cross-functional leadership.",
        experience:
          "7+ years in senior operating or executive roles (COO, VP Ops, or similar), ideally with startup or small-company scaling experience; government contract or public-sector experience a strong plus; Hawaiʻi residency/local ties preferred.",
        apply: APPLY_GENERIC,
      },
      {
        title: "Operations Director",
        description:
          "Oversees day-to-day statewide operations, builds and manages the field/ambassador team, and ensures smooth execution across all four islands throughout the pilot.",
        skills:
          "Operations management, staff supervision, logistics coordination, process design, multi-site/multi-team management.",
        experience:
          "5+ years managing multi-location or multi-team operations; experience scaling a team from small to statewide; transportation, logistics, or gig-economy platform experience a plus.",
        apply: APPLY_GENERIC,
      },
    ],
  },
  {
    icon: "💼",
    name: "Finance & Compliance",
    roles: [
      {
        title: "Finance & Compliance Manager",
        description:
          "Manages the contract budget and reporting, tracks spend across all funding lines (personnel, marketing, tech, etc.), oversees insurance requirements, and prepares for audits and compliance reviews.",
        skills:
          "Budgeting/forecasting, government contract compliance, insurance procurement, bookkeeping/accounting, audit prep, reporting.",
        experience:
          "5+ years in finance or accounting roles, ideally with government contract or grant management experience; CPA or bookkeeping certification a plus.",
        apply: APPLY_GENERIC,
      },
    ],
  },
  {
    icon: "📣",
    name: "Marketing & Communications",
    roles: [
      {
        title: "Marketing & Communications Director",
        description:
          "Leads the marketing budget — airport advertising, digital campaigns, PR, and island launch events — to convert visitor rental-car trips into rides and recruit local drivers on each island.",
        skills:
          "Marketing strategy, digital advertising (Meta/Google/TikTok), PR/media relations, event planning, brand management.",
        experience:
          "5+ years in marketing leadership, ideally in travel/tourism, transportation, or consumer platforms; Hawaiʻi market experience strongly preferred.",
        apply: APPLY_GENERIC,
      },
      {
        title: "Social Media & Storytelling Coordinator — Part Time",
        rate: "$30/hour · approximately 10 hours/week",
        description:
          "Cruise Kauaʻi is looking for a creative, community-minded Kauaʻi resident to tell the story of transportation on our island — and the people working together to change it. You'll produce a monthly interview series, manage our Instagram, and create content that is honest, warm, and rooted in real Kauaʻi voices.",
        experience:
          "Experience in video production, photography, or social media content creation preferred. Must be based on Kauaʻi and deeply familiar with the community.",
        apply: "Email cruisekauai@gmail.com with an intro and links to any past work.",
      },
    ],
  },
  {
    icon: "🌺",
    name: "Community & Culture",
    roles: [
      {
        title: "Community Engagement Manager",
        description:
          "Leads community listening sessions, cultural advisor coordination, and kūpuna/ʻōpio program development across islands, ensuring the platform builds genuine local trust and meets Nāvahine compliance expectations.",
        skills:
          "Community organizing, cultural competency, public facilitation, relationship building, program development.",
        experience:
          "5+ years in community engagement, nonprofit, or public-sector outreach roles; deep ties to Native Hawaiian and local community networks strongly preferred.",
        apply: APPLY_GENERIC,
      },
      {
        title: "Cultural Advisor (contractor, per island)",
        description:
          "Provides cultural guidance and community input during the R&D and needs-assessment phase, ensuring the platform's design and rollout respects local values and practices.",
        skills:
          "Deep cultural knowledge, community standing, facilitation, advisory experience.",
        experience:
          "Recognized community leader or cultural practitioner on the relevant island; prior advisory experience with government or community projects a plus.",
        apply: APPLY_GENERIC,
      },
      {
        title: "Community Engagement Coordinator — Part Time",
        rate: "$27/hour · 10–15 hours/week",
        description:
          "Cruise Kauaʻi is looking for a passionate, community-rooted Kauaʻi resident to help us grow. You'll organize and facilitate community listening sessions across the island, manage our partnerships with local ʻāina organizations and schools, and coordinate the logistics of our kūpuna rides program. This role is about relationships — showing up, listening, and making sure Cruise Kauaʻi reflects the real needs of our community.",
        experience:
          "Experience in community organizing, nonprofit work, or local outreach preferred. Must be based on Kauaʻi and deeply familiar with the community.",
        apply: "Email cruisekauai@gmail.com with an intro about yourself and why this work matters to you.",
      },
    ],
  },
  {
    icon: "💻",
    name: "Technology & Data",
    roles: [
      {
        title: "Technology/Product Manager",
        description:
          "Owns platform customization for Hawaiʻi — UX updates, GIS integration, VMT/cost calculators, rail/bus first-last-mile features — and manages background check system integration.",
        skills:
          "Product management, technical project management, UX collaboration, vendor/API integration management.",
        experience:
          "5+ years in product or technical program management, ideally at a startup or mobility platform; experience managing engineering roadmaps and third-party integrations.",
        apply: APPLY_GENERIC,
      },
      {
        title: "Data & Analytics Lead",
        description:
          "Builds and maintains the VMT/emissions reporting dashboard and analytics infrastructure that feeds quarterly reports and Nāvahine compliance metrics.",
        skills:
          "Data analysis, dashboard/BI tools, transportation or environmental metrics (VMT, emissions), report writing.",
        experience:
          "3–5+ years in data analytics, ideally in transportation, environmental, or public policy contexts; experience producing reports for government stakeholders a plus.",
        apply: APPLY_GENERIC,
      },
    ],
  },
  {
    icon: "🤝",
    name: "Customer Support",
    roles: [
      {
        title: "Customer Support Lead",
        description:
          "Builds and manages the customer support function for riders and drivers statewide, ensuring platform stability and responsive issue resolution as the user base scales.",
        skills:
          "Customer service operations, support team management, ticketing/CRM systems, process documentation.",
        experience:
          "3–5 years managing a customer support function, ideally at a consumer app or platform company.",
        apply: APPLY_GENERIC,
      },
    ],
  },
  {
    icon: "🚗",
    name: "Field Operations & Launch",
    roles: [
      {
        title: "Island Launch Coordinator (×4 — Oʻahu, Maui, Big Island, Kauaʻi)",
        description:
          "Runs the on-the-ground launch for one island — community launch events, ambassador recruitment/activation, driver sign-ups — targeting strong local sign-ups after launch.",
        skills:
          "Event coordination, grassroots organizing, local network building, project management.",
        experience:
          "2–5 years in community organizing, field marketing, or local event coordination; must be a resident of (or deeply connected to) the specific island.",
        apply: APPLY_GENERIC,
      },
      {
        title: "Driver & Rider Incentives Coordinator",
        description:
          "Designs and manages sign-up/milestone bonus programs and subsidized kūpuna/ʻōpio ride programs to solve the cold-start problem on each new island.",
        skills:
          "Program design, budget management, community outreach, basic data tracking.",
        experience:
          "2–4 years in program or promotions management, ideally in a gig-platform, nonprofit, or community-benefit context.",
        apply: APPLY_GENERIC,
      },
    ],
  },
];

export default function CommunityJobs() {
  return (
    <div className="p-3 md:p-8 bg-background overflow-x-hidden min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-5">
          <Link
            to="/community"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            back to community
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary">
            We're hiring! 🌺🚗✨
          </h1>
          <p className="text-gray-600 text-sm mt-3 leading-relaxed">
            Cruise Kauaʻi is growing into a statewide operation! Tap a category
            below to explore open roles. If none fit your skills but you're still
            interested in working with us, send us an email with your interests
            and how you'd like to be involved.
          </p>
        </div>

        <div className="space-y-4">
          {THEMES.map((theme, i) => (
            <JobThemeAccordion key={theme.name} theme={theme} defaultOpen={i === 0} />
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