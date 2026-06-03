import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { sendSmsNotification } from "@/functions/sendSmsNotification";

export default function WelcomeNewUserModal({ user, onStartQuiz, onDismiss }) {
  const [step, setStep] = useState("welcome"); // "welcome" | "remind"
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRemindLater = () => setStep("remind");

  const handleSendReminder = async () => {
    setSaving(true);
    const cleaned = phone.replace(/\D/g, "");
    const formatted = cleaned.length === 10 ? `+1${cleaned}` : cleaned.startsWith("1") ? `+${cleaned}` : `+${cleaned}`;
    await base44.auth.updateMe({ phone_number: phone, has_dismissed_welcome_modal: true });
    try {
      await sendSmsNotification({
        to: formatted,
        message: "Aloha from Cruise Kauaʻi! 🤙 Just a reminder to finish setting up your profile so you can start booking rides. Visit cruisekauai.org and head to your Account page. Mahalo!"
      });
    } catch (e) {
      // non-blocking
    }
    setSaving(false);
    setSent(true);
    setTimeout(() => onDismiss(), 2000);
  };

  const handleSkipReminder = async () => {
    await base44.auth.updateMe({ has_dismissed_welcome_modal: true });
    onDismiss();
  };

  if (step === "remind") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 flex flex-col items-center gap-5 text-center">
          {sent ? (
            <>
              <div className="text-4xl">✅</div>
              <h2 className="text-xl font-bold text-secondary">reminder sent!</h2>
              <p className="text-gray-500 text-sm">We'll text you this evening. Mahalo! 🤙</p>
            </>
          ) : (
            <>
              <div className="text-3xl">📱</div>
              <h2 className="text-xl font-bold text-secondary">we'll text you tonight!</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Enter your phone number and Cruise Kauaʻi will send you a reminder this evening to finish your profile.
              </p>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(808) 555-1234"
                className="rounded-2xl text-base w-full"
              />
              <Button
                onClick={handleSendReminder}
                disabled={saving || !phone.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-5 font-bold"
              >
                {saving ? "sending..." : "send me a reminder →"}
              </Button>
              <button
                onClick={handleSkipReminder}
                className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2"
              >
                no thanks, skip for now
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden my-4">
        {/* Header */}
        <div
          className="px-6 pt-8 pb-6 text-center text-white"
          style={{ background: "linear-gradient(135deg, #1a4a2e 0%, #2d6a4f 100%)" }}
        >
          <img
            src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
            alt="Cruise Kauaʻi"
            className="w-16 h-16 rounded-2xl mx-auto mb-4 object-cover shadow-lg border-2 border-white/20"
          />
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">
            welcome to cruise kauaʻi! 🤙
          </h1>
          <p className="text-green-200 text-sm">sharing aloha one ride at a time</p>
        </div>

        {/* How it works */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-gray-700 text-sm font-semibold text-center">here's how it works</p>

          <div className="space-y-3">
            {[
              { icon: "🚗", title: "drivers post rides", desc: "Locals offer seats on trips they're already making — covering their gas while helping the community." },
              { icon: "🙋", title: "riders book seats", desc: "Find affordable rides ($5–$30) from local drivers heading your way. No car rental needed." },
              { icon: "💳", title: "pay securely", desc: "Book & pay through the app. Once the driver accepts, coordinate pickup details in your Inbox." },
              { icon: "⭐", title: "rate & repeat", desc: "After every ride, rate each other. It keeps our ʻohana safe and trustworthy." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
                <div>
                  <p className="font-bold text-secondary text-sm">{title}</p>
                  <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-gray-100 my-2" />

          <p className="text-center text-gray-700 text-sm font-semibold">
            ready to fill out your profile?
          </p>
          <p className="text-center text-gray-400 text-xs leading-relaxed">
            It only takes ~2 minutes and is required before you can book or post rides.
          </p>
        </div>

        {/* CTAs */}
        <div className="px-6 pb-6 space-y-3">
          <Button
            onClick={onStartQuiz}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-5 text-base font-bold shadow-lg"
          >
            let's do it! →
          </Button>
          <button
            onClick={handleRemindLater}
            className="w-full text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
          >
            remind me later
          </button>
        </div>
      </div>
    </div>
  );
}