import React, { useState, useEffect } from "react";
import { X, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Welcome to Cruise Kauaʻi! 🌺",
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <p>Cruise Kauaʻi is a <strong>community-based ridesharing app</strong> built to reduce traffic and make transportation affordable & accessible across Hawaiʻi.</p>
        <div className="bg-green-50 rounded-2xl p-3 space-y-2">
          <div className="flex gap-2"><span>🚗</span><p><strong>Drivers</strong> offer rides on trips they're already taking & cover gas + maintenance costs.</p></div>
          <div className="flex gap-2"><span>🙋</span><p><strong>Riders</strong> find affordable rides around the island ($5–$30/ride).</p></div>
          <div className="flex gap-2"><span>🌿</span><p><strong>Result:</strong> fewer cars on the road, money in local pockets.</p></div>
        </div>
      </div>
    )
  },
  {
    title: "Add to your Home Screen 📲",
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <p>Use Cruise Kauaʻi like a native app by adding it to your home screen:</p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-blue-800 mb-2">🍎 iPhone (Safari)</p>
          <p className="text-xs text-blue-700">Tap the <strong>Share ⬆️</strong> button → scroll down → <strong>"Add to Home Screen"</strong> → tap <strong>"Add"</strong></p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-green-800 mb-2">🤖 Android (Chrome)</p>
          <p className="text-xs text-green-700">Tap the <strong>three-dot menu ⋮</strong> → <strong>"Add to Home screen"</strong> → tap <strong>"Add"</strong></p>
        </div>
      </div>
    )
  },
  {
    title: "Finding a Ride 🗺️",
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <p>Go to the <strong>Trips</strong> page and tap the <strong>"Find a Ride"</strong> tab.</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
          <p>📅 Pick your <strong>island</strong> and <strong>date range</strong> to browse all available rides.</p>
          <p>👤 Tap any ride to see the <strong>driver profile & ratings</strong> before booking.</p>
          <p>💳 Pay securely through the app — no cash needed.</p>
        </div>
        <p className="text-gray-500 text-xs">You must be signed in and have a verified profile to book a ride.</p>
      </div>
    )
  },
  {
    title: "Posting a Ride 🚗",
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <p>Drivers go to the <strong>Trips</strong> page and tap <strong>"Post a Ride"</strong>.</p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
          <p>📍 Enter your <strong>route</strong>, date, time, and price per seat.</p>
          <p>🔁 Set up <strong>recurring rides</strong> for your regular commutes.</p>
          <p>✅ Review rider profiles before accepting requests.</p>
        </div>
        <p className="text-gray-500 text-xs">Drivers need a verified license, vehicle, and bank account to receive payouts.</p>
      </div>
    )
  },
  {
    title: "Your Inbox & Account 📬",
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
          <p>📩 <strong>Inbox:</strong> manage active trips, pending requests, messages with riders/drivers, and ratings.</p>
          <p>👤 <strong>Account:</strong> complete your profile, verify your license, add payment methods, and view your ratings.</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
          <p>📣 <strong>Spread the word!</strong> The more people use Cruise Kauaʻi, the more rides are available and the less traffic there is on our island. Share with family, friends & visitors!</p>
        </div>
        <p className="text-xs text-center text-gray-400 italic">🤙 mahalo for being a part of the movement</p>
      </div>
    )
  }
];

export default function WelcomeTutorialModal({ isOpen, onClose }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2 shrink-0">
          <h2 className="text-xl font-bold text-secondary leading-tight pr-4">{steps[step].title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {steps[step].content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-5 pt-3 shrink-0 border-t border-gray-100">
          {/* Dots */}
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === step ? "bg-primary w-6" : idx < step ? "bg-primary/40 w-2" : "bg-gray-200 w-2"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="rounded-2xl px-4">
                back
              </Button>
            )}
            <Button
              onClick={() => isLast ? onClose() : setStep(s => s + 1)}
              className="bg-primary hover:bg-primary/90 rounded-2xl px-5"
            >
              {isLast ? (
                <><Check className="w-4 h-4 mr-1" /> done</>
              ) : (
                <>next <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}