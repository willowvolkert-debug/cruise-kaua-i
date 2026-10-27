import React, { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NeedHelpButton({ onOpenTutorial }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors px-3 py-1.5 rounded-xl hover:bg-gray-100 border border-gray-200"
      >
        <HelpCircle className="w-4 h-4" />
        need help?
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Popover */}
          <div className="absolute top-full right-0 mt-2 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl w-80 max-w-[90vw] p-5 space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-secondary text-base">how cruise hawaiʻi works</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex gap-2.5 items-start">
                <span className="text-base">🔍</span>
                <p><strong>Find a ride</strong> — search by date and route, view driver profiles and ratings before booking.</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="text-base">💳</span>
                <p><strong>Book & pay</strong> — request a seat and pay securely in-app. No cash needed.</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="text-base">💬</span>
                <p><strong>Coordinate</strong> — once a driver approves, you'll be connected in your Inbox to arrange pickup.</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="text-base">🚗</span>
                <p><strong>Posting a ride?</strong> Add your vehicle on the Account page first, then post your trips to earn money on drives you're already making.</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">need more?</p>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => { setOpen(false); onOpenTutorial(); }}
                  className="text-left text-sm text-primary font-medium hover:underline"
                >
                  📖 View full welcome tutorial →
                </button>
                <Link
                  to={createPageUrl("AboutUs")}
                  onClick={() => setOpen(false)}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  ❓ FAQ & About Us →
                </Link>
                <Link
                  to={createPageUrl("ContactUs")}
                  onClick={() => setOpen(false)}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  ✉️ Contact Us →
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}