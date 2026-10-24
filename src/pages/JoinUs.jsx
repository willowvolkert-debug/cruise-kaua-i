import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

const ISLANDS = [
  { value: "Kauai", label: "Kauaʻi", emoji: "🌿", status: "fully launched!" },
  { value: "Oahu", label: "Oʻahu", emoji: "🌺", status: "launching mid-summer" },
  { value: "Maui", label: "Maui", emoji: "🌊", status: "launching August" },
  { value: "Big Island", label: "Hawaiʻi Island", emoji: "🌋", status: "launching September" },
];

export default function JoinUs() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = role, 1 = island
  const [role, setRole] = useState(null);
  const [island, setIsland] = useState(null);

  const handleContinue = () => {
    if (step === 0 && role) setStep(1);
    else if (step === 1 && island) {
      // Redirect to login, passing role + island as params so Account/quiz can use them
      const params = new URLSearchParams({ setup: "true", role, island });
      base44.auth.redirectToLogin(`/account?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden flex flex-col">
      <style>{`[data-sidebar="trigger"] { display: none !important; }`}</style>

      {/* Header */}
      <div
        className="px-6 py-10 text-center text-white"
        style={{ background: "linear-gradient(135deg, #1a4a2e 0%, #2d6a4f 100%)" }}
      >
        <img
          src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
          alt="Cruise logo"
          className="w-16 h-16 rounded-2xl mx-auto mb-4 object-cover shadow-lg"
        />
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">join the community</h1>
        <p className="text-green-200 text-sm">sharing aloha one ride at a time 🤙</p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 py-5">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-gray-200"}`}
          />
        ))}
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-6 pb-10">
        {/* STEP 0: Role */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-primary mb-1">step 1 of 2</p>
              <h2 className="text-2xl font-extrabold text-gray-900">Are you a driver or rider?</h2>
              <p className="text-gray-500 text-sm mt-1">You can always do both — just pick your primary role to start.</p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => setRole("driver")}
                className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left ${role === "driver" ? "border-primary bg-primary/10" : "border-gray-200 hover:border-primary/50 bg-gray-50"}`}
              >
                <span className="text-4xl shrink-0">🚗</span>
                <div>
                  <p className="font-bold text-gray-900 text-base">I want to drive</p>
                  <p className="text-gray-500 text-sm mt-0.5">Share your commutes, cover your gas, and earn money helping your neighbors get around.</p>
                </div>
              </button>

              <button
                onClick={() => setRole("rider")}
                className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left ${role === "rider" ? "border-secondary bg-secondary/10" : "border-gray-200 hover:border-secondary/50 bg-gray-50"}`}
              >
                <span className="text-4xl shrink-0">🙋</span>
                <div>
                  <p className="font-bold text-gray-900 text-base">I need rides</p>
                  <p className="text-gray-500 text-sm mt-0.5">Find affordable rides from local drivers already heading your way. $5–$30 per ride.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Island */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-primary mb-1">step 2 of 2</p>
              <h2 className="text-2xl font-extrabold text-gray-900">Which island are you on?</h2>
              <p className="text-gray-500 text-sm mt-1">We'll connect you with the right community for your island.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {ISLANDS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setIsland(opt.value)}
                  className={`flex flex-col items-center gap-1.5 py-5 px-3 rounded-2xl border-2 text-sm font-medium transition-all ${island === opt.value ? "border-primary bg-primary/10 text-primary" : "border-gray-200 bg-gray-50 text-gray-700 hover:border-primary/50"}`}
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="font-bold">{opt.label}</span>
                  <span className="text-xs text-gray-400 font-normal text-center leading-tight">{opt.status}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(0)}
              className="rounded-full px-6 border-gray-300 text-gray-600"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> back
            </Button>
          )}
          <Button
            onClick={handleContinue}
            disabled={(step === 0 && !role) || (step === 1 && !island)}
            className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full font-bold py-5 text-base disabled:opacity-40"
          >
            {step === 1 ? "create my account →" : "continue"} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          already have an account?{" "}
          <button
            onClick={() => base44.auth.redirectToLogin("/trips")}
            className="text-primary underline underline-offset-2 font-medium"
          >
            log in →
          </button>
        </p>
      </div>
    </div>
  );
}