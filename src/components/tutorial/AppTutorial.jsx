import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

const tutorialSteps = [
  {
    title: "Trips Page",
    description: "This is where you can find rides or post your own. Switch between tabs to search for available rides or share your upcoming trips.",
    highlight: "trips-tabs",
    position: "bottom"
  },
  {
    title: "View all rides",
    description: "Pick your island, choose your date(s), and view all rides available on island during that time. Press on any ride to view driver profile & ratings before booking.",
    highlight: "find-ride-form",
    position: "bottom"
  },
  {
    title: "Post a Ride",
    description: "If you are a driver, share your upcoming trips by entering route details, date, time, and price. Set rider preferences and specify if you allow bags. When riders request to join, review their profile and accept or reject.",
    highlight: "post-ride-form",
    position: "top"
  },
  {
    title: "Inbox",
    description: "View all your active trips, pending requests, and messages. Chat with drivers or riders to coordinate pickup details. Complete ratings after each trip to keep everyone using the platform verified by other community members. We encourage you to use your best judgement before making the choice to ride with someone, and practice safe & respectful driver & rider behavior during the ride.",
    highlight: "inbox-nav",
    position: "right"
  },
  {
    title: "Account",
    description: "Manage your profile, verify your license and vehicle, add payment methods, and view your ratings. Complete all verifications before posting or booking rides.",
    highlight: "account-nav",
    position: "right"
  }
];

export default function AppTutorial({ isOpen, onClose }) {
  const [showIntro, setShowIntro] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setShowIntro(true);
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleSkip = async () => {
    await base44.auth.updateMe({ has_seen_tutorial: true });
    onClose();
    navigate(createPageUrl("Account"));
  };

  const handleStart = () => {
    setShowIntro(false);
    navigate(createPageUrl("Trips"));
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      
      // Navigate based on step
      if (currentStep === 2) {
        navigate(createPageUrl("Inbox"));
      } else if (currentStep === 3) {
        navigate(createPageUrl("Account"));
      }
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    await base44.auth.updateMe({ has_seen_tutorial: true });
    onClose();
  };

  if (!isOpen) return null;

  if (showIntro) {
    return (
      <Dialog open={true} onOpenChange={handleSkip}>
        <DialogContent className="sm:max-w-lg bg-white rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-2xl font-bold text-secondary text-center">
              welcome to cruise kauaʻi! 🌺
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 pt-1">
              a community-based ridesharing app to reduce traffic on kauaʻi
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* How it works */}
            <div className="bg-green-50 rounded-2xl p-5 space-y-4">
              <p className="font-bold text-green-800 text-xs uppercase tracking-widest">how it works</p>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex gap-3 items-start"><span className="text-xl">🚗</span><p><strong>Drivers</strong> offer rides on trips they're already taking & cover gas + vehicle maintenance costs.</p></div>
                <div className="flex gap-3 items-start"><span className="text-xl">🙋</span><p><strong>Riders</strong> find affordable, reliable transportation around the island.</p></div>
                <div className="flex gap-3 items-start"><span className="text-xl">🌿</span><p><strong>Simple:</strong> locals happy, visitors happy, & less cars on the road.</p></div>
              </div>
            </div>

            {/* Add to Home Screen */}
            <div className="space-y-4">
              <p className="font-bold text-secondary text-xs uppercase tracking-widest">install the app</p>

              <div className="flex gap-3 items-start">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                <p className="text-sm text-gray-700 pt-0.5">On your phone, open <strong>cruisekauai.org</strong> in Safari (iPhone) or Chrome (Android).</p>
              </div>

              <div className="flex gap-3 items-start">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <div className="flex-1 space-y-3">
                  <p className="text-sm font-semibold text-gray-800">Add to Home Screen</p>

                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">🍎 iPhone (Safari)</p>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3 text-sm text-blue-700">
                        <span className="text-lg leading-none mt-0.5">⬆️</span>
                        <span>Tap the <strong>Share</strong> button at the bottom of Safari</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-blue-700">
                        <span className="text-lg leading-none mt-0.5">➕</span>
                        <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-blue-700">
                        <span className="text-lg leading-none mt-0.5">✅</span>
                        <span>Tap <strong>"Add"</strong> in the top right corner</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-green-800 uppercase tracking-wider">🤖 Android (Chrome)</p>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3 text-sm text-green-700">
                        <span className="text-lg leading-none mt-0.5">⋮</span>
                        <span>Tap the <strong>three-dot menu</strong> in the top right of Chrome</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-green-700">
                        <span className="text-lg leading-none mt-0.5">📲</span>
                        <span>Tap <strong>"Add to Home screen"</strong></span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-green-700">
                        <span className="text-lg leading-none mt-0.5">✅</span>
                        <span>Tap <strong>"Add"</strong> to confirm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                <p className="text-sm text-gray-700 pt-0.5">Find the <strong>Cruise Kauaʻi icon</strong> on your home screen and open it like a regular app!</p>
              </div>
            </div>

            {/* Get involved */}
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 space-y-3">
              <p className="font-bold text-orange-800 text-xs uppercase tracking-widest">get involved</p>
              <div className="space-y-2 text-sm text-gray-700">
                <p>🏡 <strong>Local?</strong> Register as a driver & start posting rides to make money on your commutes.</p>
                <p>✈️ <strong>Visiting?</strong> Consider alternatives to car rentals — get around with Cruise Kauaʻi & The Hanalei Initiative Shuttles.</p>
                <p>📣 <strong>Spread the word!</strong> Share the app with family, friends & folks visiting!</p>
              </div>
            </div>

            <p className="text-xs text-center text-gray-400 italic">🤙 mahalo for being a part of the movement</p>

            {/* AI Assistant intro */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
              <p className="font-bold text-blue-800 text-xs uppercase tracking-widest">🤖 meet kai, your ride assistant</p>
              <p className="text-sm text-gray-700">Need help posting a ride, setting up a recurring trip, or just figuring out how things work? <strong>Kai</strong> is an AI assistant built into the app — just ask!</p>
              <a
                href={base44.agents.getWhatsAppConnectURL('ride_assistant')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                💬 Chat with Kai on WhatsApp
              </a>
            </div>

            <div className="space-y-2 pt-1">
              <Button onClick={handleStart} className="w-full bg-primary hover:bg-primary/90 rounded-2xl py-5 text-base font-semibold">
                start tutorial →
              </Button>
              <Button onClick={handleSkip} variant="outline" className="w-full rounded-2xl py-5 text-base border-gray-300">
                skip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentStepData = tutorialSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-50" />
      
      {/* Tutorial Tooltip */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-secondary mb-2">
                {currentStepData.title}
              </h3>
              <p className="text-gray-700">
                {currentStepData.description}
              </p>
            </div>
            <button
              onClick={handleComplete}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1">
              {tutorialSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentStep
                      ? "bg-primary w-6"
                      : idx < currentStep
                      ? "bg-primary/50"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
            
            <Button
              onClick={handleNext}
              className="bg-primary hover:bg-primary/90 rounded-2xl"
            >
              {currentStep === tutorialSteps.length - 1 ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  finish
                </>
              ) : (
                <>
                  next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}