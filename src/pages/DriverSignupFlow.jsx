import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Car, DollarSign, Users, Shield, CheckCircle, Star } from "lucide-react";

const STEPS = [
  {
    id: "why",
    title: "Cruise Kauaʻi needs you!",
    content: (island) => (
      <div className="space-y-4">
        <p className="text-gray-700 text-base leading-relaxed">
          Carpooling is a cultural shift, and we need reliable local drivers who want to champion a new way of getting around.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <p className="font-bold text-amber-800">The problems we're solving:</p>
          <ul className="text-amber-700 text-sm space-y-1">
            <li>⛽ Gas is expensive in Hawaiʻi</li>
            <li>🚗 Traffic is getting worse every year</li>
            <li>💸 Tourists are paying $100+/day for rentals</li>
            <li>🏡 Locals need affordable transportation options</li>
          </ul>
        </div>
        <p className="text-gray-700 text-sm">
          By becoming a driver, <strong>you become part of the solution</strong> — and get paid for trips you're already making.
        </p>
      </div>
    ),
  },
  {
    id: "earn",
    title: "Add your vehicle",
    content: (island) => (
      <div className="space-y-4">
        <p className="text-gray-700 text-base leading-relaxed">
          First, tell us about yourself — add a profile photo, bio, age, and a username so riders know who they're riding with.
        </p>
        <p className="text-gray-700 text-base leading-relaxed">
          Then add your vehicle: year, make, model, and how many seats you can offer.
        </p>
        <div className="grid grid-cols-1 gap-3">
          {[
            { label: "Short trip (under 10 miles)", range: "$5–$15 / ride" },
            { label: "Medium trip (10–30 miles)", range: "$15–$30 / ride" },
            { label: "Long trip (30+ miles)", range: "$30–$60 / ride" },
          ].map(({ label, range }) => (
            <div key={label} className="flex justify-between items-center bg-green-50 border border-green-200 rounded-2xl p-3">
              <span className="text-sm text-gray-700">{label}</span>
              <span className="font-bold text-green-700">{range}</span>
            </div>
          ))}
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="font-bold text-blue-800 text-sm">📅 Drive consistently = real income</p>
          <p className="text-blue-700 text-sm mt-1">Drivers who post 3–5 rides per week cover their gas costs and earn $200–$600/month in supplemental income.</p>
        </div>
        <div className="bg-gray-100 border border-gray-300 rounded-2xl p-3">
          <p className="text-xs text-gray-600 leading-relaxed"><strong>💡 Fee note:</strong> Cruise {island} adds a 10% connect fee on top of your listed price — which the rider pays. The price you post is exactly what you receive. For example, if you post $20, the rider pays $22.</p>
        </div>
      </div>
    ),
  },
  {
    id: "how",
    title: "Set your routes",
    content: () => (
      <div className="space-y-4">
        <p className="text-gray-700 text-base leading-relaxed">Where do you usually go? Add your regular trips so riders can find you.</p>
        <div className="grid grid-cols-1 gap-3">
          {[
            { step: "1", icon: "📋", title: "Complete your profile", desc: "Add your photo, bio, and vehicle info." },
            { step: "2", icon: "🪪", title: "Get verified", desc: "Submit your driver's license, vehicle & insurance info, and sign our driver agreement. Usually reviewed within 24 hrs." },
            { step: "3", icon: "🚗", title: "Post rides", desc: "Once you know your schedule, post your commutes, grocery runs, & more with the time, route & price. You can also set recurring trips." },
            { step: "4", icon: "💳", title: "Get paid", desc: "Riders book and pay via the app. Funds go directly to your bank account." },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">{step}</div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{icon} {title}</p>
                <p className="text-gray-600 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "commitment",
    title: "Review the agreement",
    content: (island) => (
      <div className="space-y-4">
        <p className="text-gray-700 text-base leading-relaxed">
          Quick read. We keep it simple and community-first.
        </p>
        <div className="space-y-3">
          {[
            { icon: "✅", text: "Post rides when you're heading out (even 1–2x/week helps)" },
            { icon: "✅", text: "Respond to booking requests within a few hours" },
            { icon: "✅", text: "Keep your vehicle clean and well-maintained" },
            { icon: "✅", text: "Treat riders with aloha spirit" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-3 bg-green-50 rounded-2xl p-3">
              <span className="text-base shrink-0">{icon}</span>
              <p className="text-sm text-gray-700">{text}</p>
            </div>
          ))}
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="font-bold text-red-800 text-sm">⚠️ Why consistency matters</p>
          <p className="text-red-700 text-sm mt-1">
            When riders can't find reliable rides, they leave the platform. Your consistency directly impacts how many people can benefit from Cruise {island}. We're counting on you!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "ready",
    title: "ready to join? 🌿",
    content: (island) => (
      <div className="space-y-4 text-center">
        <div className="text-6xl">🤙</div>
        <p className="text-gray-700 text-base leading-relaxed">
          Mahalo for considering becoming a driver on Cruise {island}! You're about to make a real difference in your community.
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: <DollarSign className="w-5 h-5 text-green-600" />, label: "earn money" },
            { icon: <Users className="w-5 h-5 text-blue-600" />, label: "help community" },
            { icon: <Shield className="w-5 h-5 text-primary" />, label: "safe platform" },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-gray-50 border border-gray-200 rounded-2xl p-3 flex flex-col items-center gap-2">
              {icon}
              <span className="text-xs text-gray-600 font-medium">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500">Click "Sign up as a driver" below to create your account and start the setup process.</p>
      </div>
    ),
  },
];

export default function DriverSignupFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Detect island from domain
  const hostname = window.location.hostname.toLowerCase();
  const islandKey = hostname.includes('oahu') ? 'Oʻahu' : hostname.includes('maui') ? 'Maui' : hostname.includes('bigisland') ? 'Big Island' : 'Kauaʻi';

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleSignUp = () => {
    base44.auth.redirectToLogin(createPageUrl("Account") + "?setup=true");
  };

  const handleExplore = () => {
    navigate(createPageUrl("Trips"));
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <style>{`[data-sidebar="trigger"] { display: none !important; }`}</style>

      {/* Header */}
      <div className="bg-gradient-to-b from-green-900 to-green-700 text-white px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Car className="w-7 h-7 text-green-300" />
          <h1 className="text-2xl font-extrabold tracking-tight">Turn Your Commute Into Community</h1>
        </div>
        <p className="text-green-200 text-sm">Already driving around the island? Share your ride, offset your costs, and meet your neighbors along the way.</p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 px-6 py-4 max-w-lg mx-auto">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`flex-1 h-2 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-gray-200'}`}
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
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold"
            >
              next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSignUp}
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold py-5"
            >
              Start Driving with Us 🌿
            </Button>
          )}
        </div>

        {isLast && (
          <div className="mt-3 space-y-2">
            <p className="text-center text-xs text-gray-400">No app fees. No surge pricing. Just neighbors helping neighbors.</p>
            <button
              onClick={handleExplore}
              className="w-full text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
            >
              explore the app first →
            </button>
          </div>
        )}

        {/* Step counter */}
        <p className="text-center text-xs text-gray-400 mt-4">step {step + 1} of {STEPS.length}</p>
      </div>
    </div>
  );
}