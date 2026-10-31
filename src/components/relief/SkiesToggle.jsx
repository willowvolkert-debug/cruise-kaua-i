import React from "react";
import { useSkies, toggleSkies } from "@/lib/skies";

export default function SkiesToggle() {
  const skies = useSkies();
  const grey = skies === "grey";
  return (
    <button
      onClick={toggleSkies}
      className={`whitespace-nowrap text-xs font-bold rounded-full px-2 py-1 border-2 select-none transition-colors ${
        grey ? "bg-secondary text-primary-foreground border-secondary" : "bg-card text-primary border-primary"
      }`}
    >
      {grey ? "grey skies ⛈️" : "blue skies 🌤️"}
    </button>
  );
}