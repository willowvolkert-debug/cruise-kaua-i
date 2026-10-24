import React from "react";
import { useSkies, toggleSkies } from "@/lib/skies";

export default function SkiesToggle() {
  const skies = useSkies();
  const grey = skies === "grey";
  return (
    <button
      onClick={toggleSkies}
      className={`text-sm font-bold rounded-full px-3 py-1.5 border-2 select-none transition-colors ${
        grey ? "bg-secondary text-primary-foreground border-secondary" : "bg-card text-primary border-primary"
      }`}
    >
      {grey ? "grey skies ⛈️" : "blue skies 🌤️"}
    </button>
  );
}