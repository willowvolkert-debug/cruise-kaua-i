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

  // Skip the old intro screen — new users now see WelcomeNewUserModal instead
  if (showIntro) {
    handleSkip();
    return null;
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