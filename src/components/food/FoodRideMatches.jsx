import React from "react";
import { Link } from "react-router-dom";
import { ridesForRequest, matchScore } from "@/lib/foodMatch";

// Carpool rides already heading the same way as a food request.
export default function FoodRideMatches({ request, rides }) {
  const matches = ridesForRequest(request, rides);
  if (matches.length === 0) return null;
  return (
    <div className="bg-muted rounded-lg p-3 space-y-1">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">carpool drivers heading your way</p>
      {matches.slice(0, 3).map((r) => (
        <p key={r.id} className="text-base">
          🚗 {r.driver_name}: {r.departure_location} → {r.destination} · {r.departure_time}
          {matchScore(request, r) === 2 ? " · full route" : ""}
        </p>
      ))}
      <Link to="/trips" className="text-primary font-bold text-sm select-none">see these rides in carpool →</Link>
    </div>
  );
}