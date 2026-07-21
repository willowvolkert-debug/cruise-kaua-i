import React from "react";
import { AlertCircle } from "lucide-react";

export default function HaenaWarningCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-3xl border-2 border-yellow-300/50 bg-yellow-50/50 hover:bg-yellow-100/50 transition-colors p-5"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-yellow-800 leading-tight">
            for visitors trying to get between princeville, hanalei, &amp; hāʻena state park, press here
          </p>
          <p className="text-sm text-yellow-700/90">
            Hāʻena State Park requires reservations — learn how to book your pass before requesting a ride.
          </p>
        </div>
      </div>
    </button>
  );
}