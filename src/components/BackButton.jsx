import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export const backButtonClass =
  "inline-flex items-center gap-1 h-10 pl-2 pr-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-base select-none";

// Red back button that returns to the previous page.
export default function BackButton({ onClick, className = "" }) {
  const navigate = useNavigate();
  const { key } = useLocation();
  const goBack = () => (key !== "default" ? navigate(-1) : navigate("/home"));
  return (
    <button type="button" onClick={onClick || goBack} aria-label="Go back" className={`${backButtonClass} ${className}`}>
      <ChevronLeft className="w-5 h-5" /> back
    </button>
  );
}