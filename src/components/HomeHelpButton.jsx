import React, { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import WelcomeTutorialModal from "@/components/tutorial/WelcomeTutorialModal";

// "?" button for the home page: shows the "how cruise hawaiʻi works" panel.
export default function HomeHelpButton() {
  const [open, setOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Help"
        className="inline-flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-300 text-secondary hover:bg-gray-50 select-none"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl w-80 max-w-[90vw] p-5 space-y-4 text-left">
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
                  onClick={() => { setOpen(false); setShowTutorial(true); }}
                  className="text-left text-sm text-primary font-medium hover:underline"
                >
                  📖 View full welcome tutorial →
                </button>
                <Link to="/aboutus" onClick={() => setOpen(false)} className="text-sm text-primary font-medium hover:underline">
                  ❓ FAQ & About Us →
                </Link>
                <Link to="/contactus" onClick={() => setOpen(false)} className="text-sm text-primary font-medium hover:underline">
                  ✉️ Contact Us →
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      <WelcomeTutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
}