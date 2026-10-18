import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MapPin, CheckCircle, MessageSquare, User } from "lucide-react";

const TABS = [
  { path: "/trips", label: "Trips", icon: MapPin },
  { path: "/confirmedrides", label: "Confirmed", icon: CheckCircle },
  { path: "/inbox", label: "Inbox", icon: MessageSquare },
  { path: "/account", label: "Account", icon: User },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around pb-[env(safe-area-inset-bottom)] select-none"
      style={{ boxShadow: "0 -2px 10px rgba(0,0,0,0.05)" }}
    >
      {TABS.map(({ path, label, icon: Icon }) => {
        const active = location.pathname.toLowerCase() === path ||
          (path === "/trips" && location.pathname === "/") ||
          (path !== "/trips" && location.pathname.toLowerCase().startsWith(path));
        return (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 transition-colors ${
              active ? "text-primary" : "text-gray-400"
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
            <span className={`text-[10px] font-medium ${active ? "font-bold" : ""}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}