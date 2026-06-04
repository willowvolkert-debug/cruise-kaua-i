import React, { useState } from "react";
import { base44 } from "@/api/base44Client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ISLANDS = [
  { value: "Kauai", label: "Kauaʻi", emoji: "🌿", status: "fully launched!" },
  { value: "Oahu", label: "Oʻahu", emoji: "🌺", status: "launching mid-summer" },
  { value: "Maui", label: "Maui", emoji: "🌊", status: "launching August" },
  { value: "Big Island", label: "Hawaiʻi Island", emoji: "🌋", status: "launching September" },
];

const ROLES = [
  { value: "driver", emoji: "🚗", label: "driver", desc: "Share rides you're already making and earn money helping your neighbors get around." },
  { value: "rider", emoji: "🙋", label: "rider", desc: "Find affordable rides from local drivers already heading your way. $5–$30 per ride." },
  { value: "both", emoji: "🤙", label: "both", desc: "Drive when you can, ride when you need to. Most members do both!" },
];

const TOTAL_STEPS = 3;

export default function JoinPage() {
  const [step, setStep] = useState(0); // 0=role, 1=info, 2=island
  const [role, setRole] = useState(null);
  const [island, setIsland] = useState(null);

  const canContinue = () => {
    if (step === 0) return !!role;
    if (step === 1) return true;
    if (step === 2) return !!island;
    return false;
  };

  const handleContinue = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      const driverRole = role === "driver" || role === "both" ? "driver" : "rider";
      const params = new URLSearchParams({ setup: "true", role: driverRole, island });
      const nextUrl = `/account?${params.toString()}`;
      window.location.href = `/Register?next=${encodeURIComponent(nextUrl)}`;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <style>{`[data-sidebar="trigger"] { display: none !important; }`}</style>

      {/* Minimal header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <img
          src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
          alt="Cruise logo"
          className="w-9 h-9 rounded-xl object-cover"
        />
        <button
          onClick={() => base44.auth.redirectToLogin(`${window.location.origin}/trips`)}
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-2"
        >
          already have an account? log in
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8">
        <p className="text-xs font-bold tracking-widest uppercase text-primary mb-2">
          step {step + 1} of {TOTAL_STEPS}
        </p>

        {/* STEP 0: Role */}
        {step === 0 && (
          <div className="space-y-6 flex-1">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-1">welcome! 🌺</h1>
              <p className="text-gray-500 text-base">are you signing up as a driver, rider, or both?</p>
            </div>
            <div className="grid gap-3">
              {ROLES.map(({ value, emoji, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setRole(value)}
                  className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                    role === value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 bg-gray-50 hover:border-primary/40"
                  }`}
                >
                  <span className="text-3xl shrink-0">{emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-base">{label}</p>
                    <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                  {role === value && (
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs font-bold">✓</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Info */}
        {step === 1 && (
          <div className="space-y-6 flex-1">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-1">great choice! 🤙</h1>
              <p className="text-gray-500 text-base">next, you'll create your account with your email.</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
              <p className="font-semibold text-green-900 text-base">what happens next:</p>
              <ul className="space-y-2 text-sm text-green-800">
                <li className="flex gap-2"><span>1️⃣</span><span>we'll create your account with your email</span></li>
                <li className="flex gap-2"><span>2️⃣</span><span>fill out a short profile — takes about 2 minutes</span></li>
                <li className="flex gap-2"><span>3️⃣</span><span>upload your driver's license to verify your identity</span></li>
                <li className="flex gap-2"><span>4️⃣</span><span>once approved, you can book or post rides!</span></li>
              </ul>
            </div>
            <p className="text-xs text-gray-400 text-center">
              we'll ask for your email on the next screen.
            </p>
          </div>
        )}

        {/* STEP 2: Island */}
        {step === 2 && (
          <div className="space-y-6 flex-1">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-1">which island are you on?</h1>
              <p className="text-gray-500 text-base">we'll connect you with the right community.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ISLANDS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setIsland(opt.value)}
                  className={`flex flex-col items-center gap-1.5 py-5 px-3 rounded-2xl border-2 text-sm font-medium transition-all ${
                    island === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-primary/40"
                  }`}
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="font-bold">{opt.label}</span>
                  <span className="text-xs text-gray-400 font-normal text-center leading-tight">{opt.status}</span>
                  {island === opt.value && (
                    <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center mt-1">
                      <span className="text-white text-xs font-bold">✓</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-8">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="rounded-full px-6 border-gray-300 text-gray-600"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> back
            </Button>
          )}
          <Button
            onClick={handleContinue}
            disabled={!canContinue()}
            className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full font-bold py-5 text-base disabled:opacity-40"
          >
            {step === TOTAL_STEPS - 1 ? "create my account →" : "continue"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}