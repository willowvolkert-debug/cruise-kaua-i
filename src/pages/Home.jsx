import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function Home() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => {});
  }, []);

  const sections = [
    { emoji: "👤", label: "account", desc: "Edit your profile, verify your license & vehicle, and manage payouts and settings.", to: createPageUrl("Account") },
    { emoji: "💬", label: "inbox", desc: "Manage your ride bookings, chat with drivers & riders, and review incoming requests.", to: createPageUrl("Inbox") },
    { emoji: "✅", label: "confirmed rides", desc: "Your posted rides, ride requests, and confirmed bookings in one place.", to: createPageUrl("ConfirmedRides") },
    { emoji: "✉️", label: "contact us", desc: "Questions, feedback, or need a hand? Reach out and we'll get back to you.", to: createPageUrl("ContactUs") },
    { emoji: "🌺", label: "community", desc: "Stories, updates, and photos from the Cruise Hawaiʻi community.", to: createPageUrl("Community") },
    { emoji: "ℹ️", label: "FAQ + about us", desc: "Learn about our mission to make getting around Hawaiʻi more affordable.", to: createPageUrl("AboutUs") },
  ];

  const adminEmails = [
    "willowvolkert@gmail.com",
    "nainoa.kaulukukui@gmail.com",
    "nainoa.kaulukukui@yahoo.com",
    "nainoa.kaulukuku@gmail.com",
  ];
  if (adminEmails.includes((user?.email || "").toLowerCase())) {
    sections.push({ emoji: "🛡️", label: "admin", desc: "Manage users, bookings, transactions, and platform-wide messages.", to: createPageUrl("Admin") });
  }

  return (
    <div className="p-3 md:p-8 bg-background overflow-x-hidden min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-bold text-secondary">cruise kauaʻi</h1>
          <p className="text-gray-500 text-sm mt-1 leading-relaxed">
            Welcome! Cruise Kauaʻi was started by a Kauaʻi resident who saw
            how hard it is to get around without a car — whether you're a
            resident whose car has broken down, or a visitor exploring the
            island. Our mission is to provide accessible &amp; affordable
            transportation across the islands, divert money into our local
            economy, and build a community support network where everyone can
            get to where they need to go. Get back to this home page at any
            time by pressing on our logo in the top right.
          </p>
        </div>

        {/* Primary CTAs: demand-first + supply-first */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <Link
            to="/trips?view=view_week"
            className="flex flex-col items-center gap-1.5 p-6 rounded-3xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all select-none text-center"
          >
            <span className="text-4xl">🔍</span>
            <span className="font-heading text-2xl uppercase">get a ride</span>
            <span className="text-sm opacity-90">browse rides this week by date and route</span>
          </Link>
          <Link
            to="/trips?view=post"
            className="flex flex-col items-center gap-1.5 p-6 rounded-3xl border-2 border-primary bg-card hover:bg-primary/10 transition-all select-none text-center"
          >
            <span className="text-4xl">🚗</span>
            <span className="font-heading text-2xl uppercase text-primary">post a ride</span>
            <span className="text-sm text-muted-foreground">offer seats on a trip you're already making</span>
          </Link>
        </div>
        <div className="space-y-2.5">
          {sections.map(({ emoji, label, desc, to }) => (
            <Link
              key={label}
              to={to}
              className="w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all text-left group select-none"
            >
              <span className="text-2xl sm:text-3xl shrink-0">{emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-base sm:text-lg leading-tight group-hover:text-primary transition-colors">{label}</p>
                <p className="text-muted-foreground text-sm leading-snug mt-0.5 line-clamp-2">{desc}</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary rotate-180 shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}