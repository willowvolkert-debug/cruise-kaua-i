import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, DollarSign, MapPin, Star, Clock } from "lucide-react";

const STEPS = [
  {
    id: "why",
    title: "Create your profile",
    content: (island) => (
      <div className="space-y-4">
        <p className="text-gray-700 text-base leading-relaxed">
          Name, photo, and a little about yourself — drivers appreciate knowing who's riding.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <p className="font-bold text-amber-800">The problems riders face:</p>
          <ul className="text-amber-700 text-sm space-y-1">
            <li>🚗 Rental cars cost $80–$200/day</li>
            <li>🚌 Bus routes are limited and slow</li>
            <li>🚕 Rideshare apps charge surge pricing</li>
            <li>😓 Relying on friends isn't always an option</li>
          </ul>
        </div>
        <p className="text-gray-700 text-sm">
          By becoming a rider on Cruise {island}, you get <strong>affordable rides from locals</strong> who know the island — and you support the community at the same time.
        </p>
      </div>
    ),
  },
  {
    id: "benefits",
    title: "Where do you need to go?",
    content: (island) => (
      <div className="space-y-4">
        <p className="text-gray-700 text-base leading-relaxed">Search rides by route or destination. Filter by time and availability.</p>
        <div className="grid grid-cols-1 gap-3">
          {[
            { icon: <DollarSign className="w-5 h-5 text-green-600" />, label: "affordable rides", desc: "Typical rides cost $5–$30, way cheaper than rentals or rideshare apps." },
            { icon: <Star className="w-5 h-5 text-amber-500" />, label: "verified local drivers", desc: "All drivers are verified with a valid license and community ratings." },
            { icon: <MapPin className="w-5 h-5 text-blue-600" />, label: "island routes", desc: "Rides across the whole island — not just tourist areas." },
            { icon: <Clock className="w-5 h-5 text-purple-600" />, label: "flexible timing", desc: "Browse rides by date and book in advance or last-minute." },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">{icon}</div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gray-100 border border-gray-300 rounded-2xl p-3">
          <p className="text-xs text-gray-600 leading-relaxed"><strong>💡 Fee note:</strong> Cruise {island} adds a 10% connect fee on top of the driver's listed price — that's what you pay. For example, a $20 ride costs you $22. The driver receives exactly what they posted.</p>
        </div>
      </div>
    ),
  },
  {
    id: "how",
    title: "Request a ride",
    content: () => (
      <div className="space-y-4">
        <p className="text-gray-700 text-base leading-relaxed">Send a quick request to a driver. Most respond within the hour.</p>
        <div className="grid grid-cols-1 gap-3">
          {[
            { step: "1", icon: "👤", title: "Complete your profile", desc: "Add your photo, bio, and a little about yourself so drivers feel comfortable." },
            { step: "2", icon: "🔍", title: "Browse available rides", desc: "Search rides by date and route — see who's driving and their ratings." },
            { step: "3", icon: "📲", title: "Request a seat", desc: "Send a booking request with a quick note about your trip." },
            { step: "4", icon: "✅", title: "Get confirmed & pay", desc: "Driver approves, you pay securely in the app. That's it!" },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3">
              <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-bold shrink-0">{step}</div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{icon} {title}</p>
                <p className="text-gray-600 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
          <p className="text-blue-800 text-sm font-bold">💡 pro tip</p>
          <p className="text-blue-700 text-xs mt-1">A complete profile (photo + bio) gets accepted faster. Drivers like knowing who they're riding with!</p>
        </div>
      </div>
    ),
  },
  {
    id: "profile",
    title: "Confirm & go",
    content: () => (
      <div className="space-y-4">
        <p className="text-gray-700 text-base leading-relaxed">
          Once confirmed, you'll get driver details and pickup info.
        </p>
        <div className="space-y-2">
          {[
            { icon: "📸", field: "Profile photo", why: "Drivers want to know who they're picking up." },
            { icon: "✍️", field: "Short bio", why: "A sentence or two about yourself goes a long way." },
            { icon: "🎂", field: "Age & gender", why: "Helps drivers match their rider preferences." },
            { icon: "📱", field: "Username", why: "Your handle on the platform — keep it friendly!" },
          ].map(({ icon, field, why }) => (
            <div key={field} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3">
              <span className="text-xl shrink-0">{icon}</span>
              <div>
                <p className="font-bold text-gray-800 text-sm">{field}</p>
                <p className="text-gray-500 text-xs">{why}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center">After signing up, you'll land on your Account page — fill these in first!</p>
      </div>
    ),
  },
  {
    id: "ready",
    title: "ready to ride? 🤙",
    content: (island) => (
      <div className="space-y-4 text-center">
        <div className="text-6xl">🌺</div>
        <p className="text-gray-700 text-base leading-relaxed">
          Mahalo for joining Cruise {island}! You're about to experience the island the way locals do.
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { emoji: "💰", label: "save money" },
            { emoji: "🌿", label: "go green" },
            { emoji: "🤝", label: "meet locals" },
          ].map(({ emoji, label }) => (
            <div key={label} className="bg-gray-50 border border-gray-200 rounded-2xl p-3 flex flex-col items-center gap-2">
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs text-gray-600 font-medium">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500">Click below to create your account. You'll be taken straight to your profile to get set up!</p>
      </div>
    ),
  },
];

export default function RiderSignupFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const hostname = window.location.hostname.toLowerCase();
  const islandKey = hostname.includes('oahu') ? 'Oʻahu' : hostname.includes('maui') ? 'Maui' : hostname.includes('bigisland') ? 'Big Island' : 'Kauaʻi';

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleSignUp = () => {
    base44.auth.redirectToLogin(createPageUrl("Account") + "?setup=true");
  };

  const handleExplore = () => {
    navigate(createPageUrl("Trips") + "?explore=true");
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <style>{`[data-sidebar="trigger"] { display: none !important; }`}</style>

      {/* Header */}
      <div className="bg-gradient-to-b from-amber-700 to-amber-500 text-white px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-3xl">🙋</span>
          <h1 className="text-2xl font-extrabold tracking-tight">Get Around {islandKey} for Less</h1>
        </div>
        <p className="text-amber-100 text-sm">Skip the rental car stress. Find a local driver heading your way and ride affordably across {islandKey}.</p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 px-6 py-4 max-w-lg mx-auto">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`flex-1 h-2 rounded-full transition-all ${i <= step ? 'bg-secondary' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="max-w-lg mx-auto px-6 pb-8">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-secondary mb-4">{currentStep.title}</h2>
          {currentStep.content(islandKey)}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {!isFirst && (
            <Button
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              className="flex-1 rounded-2xl border-gray-300"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> back
            </Button>
          )}
          {!isLast ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 bg-secondary hover:bg-secondary/90 text-white rounded-2xl font-bold"
            >
              next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSignUp}
              className="flex-1 bg-secondary hover:bg-secondary/90 text-white rounded-2xl font-bold py-5"
            >
              Find My First Ride 🌺
            </Button>
          )}
        </div>

        {isLast && (
          <div className="mt-3 space-y-2">
            <p className="text-center text-xs text-gray-400">Community-verified drivers. Transparent pricing. Built for {islandKey} locals and long-term visitors.</p>
            <button
              onClick={handleExplore}
              className="w-full text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
            >
              explore the app first →
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">step {step + 1} of {STEPS.length}</p>
      </div>
    </div>
  );
}