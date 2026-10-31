import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import HomeHelpButton from "@/components/HomeHelpButton";
import IslandSwitcher from "@/components/IslandSwitcher";
import SkiesToggle from "@/components/relief/SkiesToggle";
import CarpoolMenu from "@/components/pool/CarpoolMenu";
import { useSkies } from "@/lib/skies";
import { ISLAND_TRUCK_URL } from "@/components/welcome/WelcomeHero";

export default function BrandHeader({ right = null }) {
  const skies = useSkies();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/" || pathname.toLowerCase() === "/home";

  const goBack = () => {
    // location.key is "default" when this is the first in-app entry (e.g. after a full reload)
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/home");
  };

  return (
    <header className="bg-card border-b border-border h-16 px-3 pt-[env(safe-area-inset-top)] flex justify-between gap-1 items-center sticky top-0 z-30 select-none">
      <div className="flex items-center">
        {!isHome && (
          <button
            onClick={goBack}
            aria-label="Go back"
            className="inline-flex items-center gap-1 h-10 pl-2 pr-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-base"
          >
            <ChevronLeft className="w-5 h-5" /> back
          </button>
        )}
        {isHome && (
          <div className="flex items-center gap-1.5">
            <SkiesToggle />
            {skies !== "grey" && <CarpoolMenu />}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-1.5">
        {right}
        {isHome && <HomeHelpButton />}
        <IslandSwitcher />
        <Link to="/home" aria-label="Home" className="hidden sm:block">
          <img src={ISLAND_TRUCK_URL} alt="" className="w-10 h-10 object-contain" />
        </Link>
      </div>
    </header>
  );
}