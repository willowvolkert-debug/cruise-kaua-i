import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Car, Users } from "lucide-react";

const DISMISSAL_KEY = "cruise_signup_prompt_dismissed";

export default function SignupPromptModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSAL_KEY, "1");
    } catch (e) {}
    onClose();
  };

  // X / "maybe later" — dismiss and stay on home
  const handleDismissToHome = () => {
    handleDismiss();
    navigate("/");
  };

  const handleSignup = () => {
    handleDismiss();
    navigate("/join");
  };

  const handleBrowse = () => {
    handleDismiss();
    navigate("/trips?explore=true");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-5">
        <button
          onClick={handleDismissToHome}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3">
          <img
            src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
            alt="Cruise Hawaiʻi"
            className="w-16 h-16 rounded-2xl object-cover mx-auto shadow-md"
          />
          <h2 className="text-xl font-extrabold text-secondary">welcome! 🤙</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Create a free account to book rides, post trips you're already
            making, and join our community of neighbors helping neighbors get
            around Hawaiʻi.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/5 rounded-2xl p-3 text-center space-y-1">
            <Car className="w-5 h-5 text-primary mx-auto" />
            <p className="text-xs font-semibold text-gray-700">post rides</p>
            <p className="text-[11px] text-gray-400">earn on trips you're already taking</p>
          </div>
          <div className="bg-secondary/5 rounded-2xl p-3 text-center space-y-1">
            <Users className="w-5 h-5 text-secondary mx-auto" />
            <p className="text-xs font-semibold text-gray-700">book rides</p>
            <p className="text-[11px] text-gray-400">$5–$30 per ride, no car needed</p>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleSignup}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-bold py-5 text-base"
          >
            create a free account →
          </Button>
          <button
            onClick={handleBrowse}
            className="w-full text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors py-1"
          >
            browse rides without signing up →
          </button>
          <button
            onClick={handleDismissToHome}
            className="w-full text-xs text-gray-400 hover:text-gray-500 transition-colors pt-1"
          >
            maybe later
          </button>
        </div>
      </div>
    </div>
  );
}