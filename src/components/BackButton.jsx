import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export const backButtonClass =
  "inline-flex items-center gap-1 min-h-[44px] min-w-[44px] pl-1 pr-3 text-secondary hover:underline font-bold text-base select-none";

// Ocean-blue text link button that returns to the previous page.
export default function BackButton({ onClick, className = "" }) {
  const navigate = useNavigate();
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate("/home"));
  return (
    <button type="button" onClick={onClick || goBack} aria-label="Go back" className={`${backButtonClass} ${className}`}>
      <ChevronLeft className="w-5 h-5" /> back
    </button>
  );
}