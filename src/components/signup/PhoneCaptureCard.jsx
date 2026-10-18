import React, { useState } from "react";
import { Smartphone, ArrowRight } from "lucide-react";

const formatPhone = (raw) => {
  const clean = raw.replace(/[^0-9]/g, "").slice(0, 10);
  if (clean.length === 0) return "";
  if (clean.length < 4) return clean;
  if (clean.length < 7) return `(${clean.slice(0, 3)}) ${clean.slice(3)}`;
  return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
};

/**
 * Phone number capture card — shown after email verification during signup.
 * Styled as a modal with a dark green header per the Figma design.
 */
export default function PhoneCaptureCard({ onSubmit, loading }) {
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const digits = phone.replace(/[^0-9]/g, "");
    if (digits.length !== 10) {
      setError("please enter a valid 10-digit phone number.");
      return;
    }
    if (!agreed) {
      setError("please agree to the SMS terms to continue.");
      return;
    }
    setError("");
    onSubmit(phone);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        {/* Dark green header */}
        <div className="bg-[#1B4332] px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">what's your number?</h2>
            <p className="text-white/70 text-sm">we'll text you ride updates &amp; reminders</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5 block">
              phone number *
            </label>
            <input
              type="tel"
              inputMode="tel"
              placeholder="(808) 555-1234"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full h-12 px-4 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-[#2D6A4F] focus:bg-white outline-none transition-colors text-gray-900 font-medium text-base"
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 text-[#2D6A4F] focus:ring-[#2D6A4F] shrink-0"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              I agree to receive automated transactional SMS messages from Cruise Hawaiʻi (ride confirmations, reminders, booking notifications). Message &amp; data rates may apply. Reply STOP to unsubscribe. SMS Terms.
            </span>
          </label>

          {error && (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !phone || !agreed}
            className="w-full bg-[#2D6A4F] hover:bg-[#245540] text-white font-bold rounded-full py-3.5 text-base transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            {loading ? "saving..." : <>continue <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}