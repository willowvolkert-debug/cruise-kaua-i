import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { CheckCircle, ChevronRight, Car, DollarSign, Clock, Users, Shield, Star } from "lucide-react";

const STEPS = [
  {
    id: 1,
    emoji: "👋",
    title: "welcome, future driver!",
    subtitle: "here's why drivers are the backbone of our community",
    content: (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="text-green-800 font-bold text-base mb-2">why consistent drivers matter 🌿</p>
          <p className="text-green-700 text-sm leading-relaxed">
            Riders depend on knowing that rides will be available. Every driver who commits to posting regularly — even just a few days a week — makes the whole community more reliable and trustworthy.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <DollarSign className="w-5 h-5 text-green-600" />, title: "earn extra cash", desc: "Cover your gas & maintenance on trips you're already taking" },
            { icon: <Users className="w-5 h-5 text-blue-600" />, title: "build community", desc: "Meet your neighbors and help visitors experience real hawaiʻi" },
            { icon: <Clock className="w-5 h-5 text-amber-600" />, title: "flexible schedule", desc: "Post only when it works for you — no commitments" },
            { icon: <Star className="w-5 h-5 text-purple-600" />, title: "build a reputation", desc: "Top drivers earn 5-star reviews and loyal repeat riders" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
              <div className="mb-1">{icon}</div>
              <p className="font-bold text-gray-800 text-xs">{title}</p>
              <p className="text-gray-500 text-xs mt-0.5 leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 2,
    emoji: "💰",
    title: "how much can you earn?",
    subtitle: "real numbers from our driver community",
    content: (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <p className="text-amber-800 font-bold text-3xl">$15–50</p>
          <p className="text-amber-700 text-sm">per ride, depending on distance</p>
        </div>
        <div className="space-y-3">
          {[
            { route: "Lihue → Hanalei", earn: "$25–35", freq: "popular daily route" },
            { route: "Poipū → Lihue", earn: "$15–20", freq: "frequent short trip" },
            { route: "Airport pickups", earn: "$20–40", freq: "high demand" },
          ].map(({ route, earn, freq }) => (
            <div key={route} className="flex items-center justify-between bg-white rounded-2xl p-3 border border-gray-200 shadow-sm">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{route}</p>
                <p className="text-xs text-gray-500">{freq}</p>
              </div>
              <p className="font-bold text-green-600 text-base">{earn}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center">* Cruise Hawaiʻi takes a small 10% connect fee. You keep the rest.</p>
      </div>
    ),
  },
  {
    id: 3,
    emoji: "📋",
    title: "what you'll need to set up",
    subtitle: "the setup process takes about 10–15 minutes",
    content: (
      <div className="space-y-3">
        {[
          { step: "1", title: "create your account", desc: "Sign up with your email — takes 30 seconds", done: true },
          { step: "2", title: "complete your profile", desc: "Add a photo, bio, age & gender so riders feel comfortable", done: false },
          { step: "3", title: "submit your driver's license", desc: "We verify all drivers for rider safety (reviewed within 24hrs)", done: false },
          { step: "4", title: "add your vehicle details", desc: "Car make/model + photos of interior & exterior", done: false },
          { step: "5", title: "connect bank account", desc: "Set up Stripe to receive payments directly", done: false },
          { step: "6", title: "accept our agreements", desc: "Terms of service, privacy policy & community agreement", done: false },
          { step: "7", title: "post your first ride!", desc: "Set your route, time & price — you're live!", done: false },
        ].map(({ step, title, desc, done }) => (
          <div key={step} className="flex items-start gap-3 bg-white rounded-2xl p-3 border border-gray-200 shadow-sm">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {done ? <CheckCircle className="w-4 h-4" /> : step}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 4,
    emoji: "🤙",
    title: "commit to the community",
    subtitle: "a small pledge goes a long way",
    content: (
      <div className="space-y-4">
        <div className="bg-green-900 text-white rounded-2xl p-5 space-y-3">
          <p className="font-bold text-green-300 text-sm uppercase tracking-wider">the driver pledge</p>
          {[
            "I will post rides consistently, at least a few times per week",
            "I will communicate clearly with riders and confirm or decline bookings promptly",
            "I will keep my vehicle clean and arrive on time",
            "I will treat all riders with aloha spirit — locals and visitors alike",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              <p className="text-green-100 text-sm">{item}</p>
            </div>
          ))}
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-blue-800 text-sm font-medium">
            🌺 You don't have to be perfect — just consistent. The more you show up, the more the community grows around you.
          </p>
        </div>
        <p className="text-center text-gray-600 text-sm font-medium">Ready? Let's get you set up! 🚗</p>
      </div>
    ),
  },
];

export default function DriverSignupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      base44.auth.redirectToLogin(createPageUrl("Account"));
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      navigate(-1);
    } else {
      setCurrentStep(s => s - 1);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <style>{`[data-sidebar="trigger"] { display: none !important; }`}</style>

      {/* Header */}
      <div className="bg-gradient-to-r from-green-900 to-green-700 text-white px-5 py-4 flex items-center gap-3">
        <button onClick={handleBack} className="text-green-300 hover:text-white transition-colors text-sm">← back</button>
        <div className="flex-1 text-center">
          <p className="text-xs text-green-300 font-medium uppercase tracking-widest">driver signup</p>
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentStep ? 'bg-white' : i < currentStep ? 'bg-green-400' : 'bg-green-700'}`} />
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Step header */}
        <div className="text-center space-y-2">
          <div className="text-5xl">{step.emoji}</div>
          <h1 className="text-2xl font-extrabold text-green-900">{step.title}</h1>
          <p className="text-gray-500 text-sm">{step.subtitle}</p>
        </div>

        {/* Step content */}
        <div>{step.content}</div>

        {/* Navigation */}
        <div className="space-y-3 pb-8">
          <Button
            onClick={handleNext}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-white py-5 text-base font-bold rounded-2xl shadow-md flex items-center justify-center gap-2"
          >
            {isLast ? (
              <>create my driver account <Car className="w-5 h-5" /></>
            ) : (
              <>next <ChevronRight className="w-5 h-5" /></>
            )}
          </Button>
          {currentStep === 0 && (
            <Button
              onClick={() => navigate(createPageUrl("Welcome"))}
              variant="outline"
              size="lg"
              className="w-full border-gray-300 text-gray-600 py-5 text-sm rounded-2xl"
            >
              not ready yet → explore the app first
            </Button>
          )}
        </div>

        {/* Step counter */}
        <p className="text-center text-xs text-gray-400">step {currentStep + 1} of {STEPS.length}</p>
      </div>
    </div>
  );
}