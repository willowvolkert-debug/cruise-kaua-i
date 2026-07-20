import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function Home() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const sections = [
    { emoji: "🚗", label: "trips", desc: "Browse available rides, post a ride you're already making, or request one for a specific trip.", to: createPageUrl("Trips") },
    { emoji: "🌺", label: "community", desc: "Stories, updates, and photos from the Cruise Hawaiʻi community.", to: createPageUrl("Community") },
    { emoji: "💬", label: "inbox", desc: "Manage your ride bookings, chat with drivers & riders, and review incoming requests.", to: createPageUrl("Inbox") },
    { emoji: "✅", label: "confirmed rides", desc: "See your upcoming confirmed trips and their details in one place.", to: createPageUrl("ConfirmedRides") },
    { emoji: "👤", label: "account", desc: "Edit your profile, verify your license & vehicle, and manage payouts and settings.", to: createPageUrl("Account") },
    { emoji: "ℹ️", label: "about us", desc: "Learn about our mission to make getting around Hawaiʻi more affordable.", to: createPageUrl("AboutUs") },
    { emoji: "✉️", label: "contact us", desc: "Questions, feedback, or need a hand? Reach out and we'll get back to you.", to: createPageUrl("ContactUs") },
  ];

  const adminEmails = [
    "george.burkhart@pm.me",
    "nainoa.kaulukukui@gmail.com",
    "nainoa.kaulukukui@yahoo.com",
    "nainoa.kaulukuku@gmail.com",
  ];
  if (adminEmails.includes((user?.email || "").toLowerCase())) {
    sections.push({ emoji: "🛡️", label: "admin", desc: "Manage users, bookings, transactions, and platform-wide messages.", to: createPageUrl("Admin") });
  }

  return (
    <div className="p-3 md:p-8 bg-white overflow-x-hidden min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-bold text-secondary">home</h1>
          <p className="text-gray-500 text-sm mt-1 leading-relaxed">Aloha! Welcome to our new flow for Cruise Kauaʻi. Get back to this home page at any time by pressing on our logo in the top right. Check out our community page for more updates on business &amp; community development</p>
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