import React, { useState, useEffect } from "react";
import { X, ArrowRight, Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { sendInstallHelpEmail } from "@/functions/sendInstallHelpEmail";

// ── Page 1: How It Works ────────────────────────────────────────────────────
function HowItWorksPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">how it works 🌺</h1>
        <p className="text-gray-500 text-sm mt-1">a community carpooling service built for Hawaiʻi</p>
      </div>

      {/* Driver + Rider */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2 text-center">
          <p className="text-3xl">🚗</p>
          <p className="font-bold text-green-900 text-sm">Drivers</p>
          <p className="text-green-700 text-xs leading-relaxed">Share rides you're already making & cover your gas.</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2 text-center">
          <p className="text-3xl">🙋</p>
          <p className="font-bold text-blue-900 text-sm">Riders</p>
          <p className="text-blue-700 text-xs leading-relaxed">Find affordable rides from locals. Just $5–$30 per ride.</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {[
          { icon: "👤", text: "Create your profile — takes about 2 minutes" },
          { icon: "🪪", text: "Verify your ID — we review within 24 hrs" },
          { icon: "🔍", text: "Browse rides or post your own on the Trips page" },
          { icon: "💳", text: "Pay & communicate securely in the app" },
          { icon: "⭐", text: "Rate your driver or rider after the trip" },
        ].map(({ icon, text }) => (
          <div key={icon} className="flex items-start gap-3 bg-gray-50 rounded-2xl px-4 py-3">
            <span className="text-lg shrink-0">{icon}</span>
            <p className="text-sm text-gray-700">{text}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center italic">Less cars on the road & more money in locals' pockets 🌿</p>
    </div>
  );
}

// ── Page 2: Install the App ─────────────────────────────────────────────────
function InstallAppPage({ onConfused }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">install the app 📲</h1>
        <p className="text-gray-600 text-sm mt-1 font-medium">
          we don't need the app store anymore! you can install this app right here, right now.
        </p>
      </div>

      {/* iPhone instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
        <p className="font-bold text-blue-900 text-sm">🍎 iPhone (Safari)</p>
        <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside leading-relaxed">
          <li>
            Look for the <strong>Share button</strong> at the bottom of your browser —
            it looks like this:
            <span className="inline-flex items-center justify-center w-7 h-7 mx-1 bg-blue-100 rounded-lg border border-blue-300 align-middle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-700">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </span>
          </li>
          <li>Scroll down in the menu and tap <strong>"Add to Home Screen"</strong></li>
          <li>Tap <strong>"Add"</strong> — done! 🎉</li>
        </ol>
        <p className="text-xs text-blue-600 border border-blue-300 rounded-xl px-3 py-2 bg-white/60">
          You may have to press on the <strong>...</strong> to see this option
        </p>
      </div>

      {/* Android instructions */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
        <p className="font-bold text-green-900 text-sm">🤖 Android (Chrome)</p>
        <ol className="space-y-1.5 text-sm text-green-800 list-decimal list-inside leading-relaxed">
          <li>Tap the <strong>⋮ menu</strong> (three dots) in the top-right of Chrome</li>
          <li>Tap <strong>"Add to Home screen"</strong> → <strong>"Add"</strong></li>
        </ol>
      </div>

      <p className="text-xs text-center text-gray-400 italic">🤙 mahalo for being a part of the movement</p>
    </div>
  );
}

// ── Main Modal ──────────────────────────────────────────────────────────────
const PAGES = ["how_it_works", "install_app"];

export default function WelcomeTutorialModal({ isOpen, onClose }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [confusedLoading, setConfusedLoading] = useState(false);
  const [confusedDone, setConfusedDone] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPageIndex(0);
      setConfusedDone(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isLast = pageIndex === PAGES.length - 1;
  const currentPage = PAGES[pageIndex];

  const handleDone = () => {
    onClose();
  };

  const handleConfused = async () => {
    setConfusedLoading(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      // Submit a ContactInquiry
      await base44.entities.ContactInquiry.create({
        user_id: user?.id || "anonymous",
        user_name: user?.full_name || "Anonymous",
        user_email: user?.email || "unknown",
        subject: "Help installing the app",
        message: "I'm having trouble adding Cruise Kauaʻi to my home screen as an app.",
        priority: "low",
      });
      // Send the detailed help email
      if (user?.email) {
        await sendInstallHelpEmail({ email: user.email, name: user.full_name });
      }
    } catch (e) {
      // non-critical
    }
    setConfusedLoading(false);
    setConfusedDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <div className="flex gap-1.5 items-center">
            {PAGES.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === pageIndex ? "bg-primary w-6" : idx < pageIndex ? "bg-primary/40 w-2" : "bg-gray-200 w-2"
                }`}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {currentPage === "how_it_works" && <HowItWorksPage />}
          {currentPage === "install_app" && <InstallAppPage />}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 shrink-0 border-t border-gray-100 space-y-3">
          {/* Confused state feedback */}
          {currentPage === "install_app" && confusedDone && (
            <p className="text-center text-sm text-green-700 font-medium bg-green-50 rounded-2xl px-4 py-2">
              ✅ Got it! We sent a step-by-step guide to your email.
            </p>
          )}

          <div className="flex items-center gap-3">
            {/* Left button */}
            {currentPage === "how_it_works" && (
              <div className="flex-1" />
            )}
            {currentPage === "install_app" && !confusedDone && (
              <Button
                variant="outline"
                onClick={handleConfused}
                disabled={confusedLoading}
                className="flex-1 rounded-full border-green-400 text-green-700 hover:bg-green-50 text-sm px-3"
              >
                {confusedLoading ? "sending..." : "I'm confused, help please!"}
              </Button>
            )}
            {currentPage === "install_app" && confusedDone && (
              <Button
                variant="outline"
                onClick={() => setPageIndex(p => p - 1)}
                className="rounded-full border-gray-300 text-gray-600 px-4"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> back
              </Button>
            )}

            {/* Right button */}
            <Button
              onClick={isLast ? handleDone : () => setPageIndex(p => p + 1)}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full font-bold py-5"
            >
              {isLast ? (
                <><Check className="w-4 h-4 mr-1" /> got it!</>
              ) : (
                <>got it <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>

          {/* Back navigation for page 2 (when not confused) */}
          {currentPage === "install_app" && !confusedDone && (
            <button
              onClick={() => setPageIndex(p => p - 1)}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}