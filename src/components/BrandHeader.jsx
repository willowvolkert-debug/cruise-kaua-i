import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { TRUCK_URL, ISLAND_TRUCK_URL } from "@/components/welcome/WelcomeHero";

export default function BrandHeader({ right = null }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/" || pathname.toLowerCase() === "/home";

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/home");
  };

  return (
    <header className="bg-card border-b border-border h-16 px-3 pt-[env(safe-area-inset-top)] grid grid-cols-[1fr_auto_1fr] items-center sticky top-0 z-30 select-none">
      <div className="flex items-center">
        {!isHome && (
          <button
            onClick={goBack}
            aria-label="Go back"
            className="flex items-center gap-0.5 text-primary font-semibold text-base py-2 pr-3"
          >
            <ChevronLeft className="w-5 h-5" /> back
          </button>
        )}
      </div>
      <Link to="/home" aria-label="Cruise Kauaʻi home" className="flex items-center justify-center">
        <img src={TRUCK_URL} alt="Cruise Kauaʻi" className="h-12 w-auto object-contain" />
      </Link>
      <div className="flex items-center justify-end gap-3">
        {right}
        <Link to="/home" aria-label="Home">
          <img src={ISLAND_TRUCK_URL} alt="" className="w-10 h-10 object-contain" />
        </Link>
      </div>
    </header>
  );
}