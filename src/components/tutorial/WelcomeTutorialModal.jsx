import React, { useState, useEffect } from "react";
import { X, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    emoji: "🌺",
    title: "Welcome to Cruise Kauaʻi!",
    content: (
      <div className="space-y-4 text-sm text-gray-700">
        <p className="text-base text-gray-800">A <strong>community carpooling app</strong> built to make getting around Hawaiʻi easier and more affordable.</p>
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { emoji: "🚗", label: "Drivers share rides" },
            { emoji: "🙋", label: "Riders save money" },
            { emoji: "🌿", label: "Less traffic" },
          ].map(({ emoji, label }) => (
            <div key={label} className="bg-green-50 rounded-2xl p-3 text-center space-y-1">
              <p className="text-2xl">{emoji}</p>
              <p className="text-xs font-semibold text-green-800">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-xs text-center pt-1">Drivers cover gas. Riders get affordable rides. Everyone wins.</p>
      </div>
    )
  },
  {
    emoji: "🗺️",
    title: "Finding a Ride",
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <p>Go to <strong>Trips → Find a Ride</strong> tab.</p>
        <div className="space-y-2">
          {[
            { icon: "📅", text: "Pick your island & date range to see all available rides" },
            { icon: "👤", text: "Tap any ride to see the driver's profile & ratings" },
            { icon: "💳", text: "Pay securely through the app — no cash needed" },
          ].map(({ icon, text }) => (
            <div key={icon} className="flex items-start gap-3 bg-amber-50 rounded-2xl px-4 py-3">
              <span className="text-lg shrink-0">{icon}</span>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">You need a verified profile to book.</p>
      </div>
    )
  },
  {
    emoji: "🚘",
    title: "Posting a Ride",
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <p>Go to <strong>Trips → Post a Ride</strong> tab.</p>
        <div className="space-y-2">
          {[
            { icon: "📍", text: "Enter your route, date, time, and price per seat" },
            { icon: "🔁", text: "Set up recurring rides for regular commutes" },
            { icon: "✅", text: "Review rider profiles before accepting requests" },
          ].map(({ icon, text }) => (
            <div key={icon} className="flex items-start gap-3 bg-blue-50 rounded-2xl px-4 py-3">
              <span className="text-lg shrink-0">{icon}</span>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">Drivers need a verified license, vehicle & bank account.</p>
      </div>
    )
  },
  {
    emoji: "📬",
    title: "Inbox & Account",
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <div className="bg-green-50 rounded-2xl px-4 py-3 space-y-2">
          <p className="font-bold text-green-800">📩 Inbox</p>
          <p>Manage active trips, pending requests, messages with riders/drivers, and post-trip ratings.</p>
        </div>
        <div className="bg-purple-50 rounded-2xl px-4 py-3 space-y-2">
          <p className="font-bold text-purple-800">👤 Account</p>
          <p>Complete your profile, verify your license, add payment methods, and view your ratings.</p>
        </div>
        <p className="text-xs text-gray-400 text-center">Complete all verifications before posting or booking rides.</p>
      </div>
    )
  },
  {
    emoji: "📲",
    title: "Add to Your Home Screen",
    content: (
      <div className="space-y-3 text-sm text-gray-700">
        <p>Use Cruise Kauaʻi like a native app — add it to your phone!</p>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
          <p className="font-bold text-blue-800 text-xs uppercase tracking-wide">🍎 iPhone (Safari)</p>
          <p className="text-blue-700">Tap <strong>Share ⬆️</strong> → <strong>"Add to Home Screen"</strong> → <strong>"Add"</strong></p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
          <p className="font-bold text-green-800 text-xs uppercase tracking-wide">🤖 Android (Chrome)</p>
          <p className="text-green-700">Tap <strong>⋮ menu</strong> → <strong>"Add to Home screen"</strong> → <strong>"Add"</strong></p>
        </div>
        <p className="text-xs text-center text-gray-400 italic pt-1">🤙 mahalo for being a part of the movement</p>
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '88vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{steps[step].emoji}</span>
            <h2 className="text-xl font-bold text-secondary leading-tight">{steps[step].title}</h2>
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
          {steps[step].content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-5 pt-3 shrink-0 border-t border-gray-100">
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