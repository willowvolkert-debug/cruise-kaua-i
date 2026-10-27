import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { sendSmsNotification } from "@/functions/sendSmsNotification";
import { sendAdminMessage } from "@/functions/sendAdminMessage";
import SkiesCard from "@/components/welcome/SkiesCard";

export default function WelcomeNewUserModal({ user, onStartQuiz, onDismiss }) {
  const [step, setStep] = useState("welcome"); // "welcome" | "add_to_home" | "remind"
  const [helpSent, setHelpSent] = useState(false);
  const [sendingHelp, setSendingHelp] = useState(false);
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRemindLater = () => setStep("remind");

  const handleNeedsHelp = async () => {
    setSendingHelp(true);
    try {
      await sendAdminMessage({
        subject: "User needs help adding app to home screen",
        message: `${user?.full_name || "A user"} (${user?.email || "unknown email"}) tapped "I'm confused and need help!" on the Add to Home Screen step. Please reach out to help them install the app.`,
      });
    } catch (e) {
      // non-blocking
    }
    setSendingHelp(false);
    setHelpSent(true);
  };

  const handleSendReminder = async () => {
    setSaving(true);
    const cleaned = phone.replace(/\D/g, "");
    const formatted = cleaned.length === 10 ? `+1${cleaned}` : cleaned.startsWith("1") ? `+${cleaned}` : `+${cleaned}`;
    await base44.auth.updateMe({ phone_number: phone, has_dismissed_welcome_modal: true });
    try {
      await sendSmsNotification({
        to: formatted,
        message: "Aloha from Cruise Hawaiʻi! 🤙 Just a reminder to finish setting up your profile so you can start booking rides. Visit cruisekauai.org and head to your Account page. Mahalo!"
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

  if (step === "skies") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
        <div className="bg-card rounded-3xl shadow-2xl border-2 border-foreground/10 max-w-sm w-full p-6 my-4">
          <SkiesCard onContinue={() => setStep("add_to_home")} />
        </div>
      </div>
    );
  }

  if (step === "add_to_home") {
    return (
      <AddToHomeScreen
        onAmazing={onStartQuiz}
        onNeedsHelp={handleNeedsHelp}
        helpSent={helpSent}
        sendingHelp={sendingHelp}
      />
    );
  }

  if (step === "remind") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-card rounded-3xl shadow-2xl border-2 border-foreground/10 max-w-sm w-full p-8 flex flex-col items-center gap-5 text-center">
          {sent ? (
            <>
              <div className="text-4xl">✅</div>
              <h2 className="text-xl font-bold text-secondary">reminder sent!</h2>
              <p className="text-muted-foreground text-sm">We'll text you this evening. Mahalo! 🤙</p>
            </>
          ) : (
            <>
              <div className="text-3xl">📱</div>
              <h2 className="text-xl font-bold text-secondary">we'll text you tonight!</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Enter your phone number and Cruise Hawaiʻi will send you a reminder this evening to finish your profile.
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
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
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
      <div className="bg-card rounded-3xl shadow-2xl border-2 border-foreground/10 max-w-sm w-full overflow-hidden my-4">
        {/* Header */}
        <div className="px-6 pt-14 pb-6 text-center text-white bg-primary">
          <h1 className="cruise-head text-4xl text-white">
            welcome to cruise hawaiʻi
          </h1>
        </div>

        {/* How it works */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-foreground text-sm font-semibold text-center">here's how it works</p>

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
                  <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-border my-2" />

          <p className="text-center text-foreground text-sm font-semibold">
            ready to fill out your profile?
          </p>
          <p className="text-center text-muted-foreground text-xs leading-relaxed">
            It only takes ~2 minutes and is required before you can book or post rides.
          </p>
        </div>

        {/* CTAs */}
        <div className="px-6 pb-6 space-y-3">
          <Button
            onClick={() => setStep("skies")}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-5 text-base font-bold shadow-lg"
          >
            let's do it! →
          </Button>
          <button
            onClick={handleRemindLater}
            className="w-full text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            remind me later
          </button>
        </div>
      </div>
    </div>
  );
}

function AddToHomeScreen({ onAmazing, onNeedsHelp, helpSent, sendingHelp }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-card rounded-3xl shadow-2xl border-2 border-foreground/10 max-w-sm w-full overflow-hidden my-4">
        <div className="px-6 pt-7 pb-5 text-center text-white bg-secondary">
          <div className="text-3xl mb-2">📲</div>
          <h2 className="cruise-head text-3xl">add cruise hawaiʻi to your home screen</h2>
          <p className="text-white/80 text-sm mt-1">no app store needed — ever!</p>
        </div>

        <div className="px-6 py-6 flex flex-col items-center gap-5">
          {/* Arrow pointing down */}
          <div className="flex flex-col items-center gap-1 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-xs text-muted-foreground font-medium">look at the bottom of your browser</span>
          </div>

          <div className="bg-muted border border-border rounded-2xl p-4 w-full space-y-3 text-sm text-foreground leading-relaxed">
            <p>
              Press the{" "}
              <span className="font-semibold text-secondary">share icon</span>{" "}
              {/* iOS share icon inline SVG */}
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 mx-1 align-middle">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              </span>{" "}
              in your browser's bottom tab.
            </p>
            <p>
              Press <span className="font-semibold text-secondary">"Add to Home Screen"</span>, which may be under{" "}
              <span className="font-semibold text-secondary">"Edit Actions"</span>.
            </p>
            <p className="text-primary font-semibold">
              Voilà! Your app that will never require the app store again!
            </p>
          </div>

          {helpSent ? (
            <div className="w-full bg-yellow-50 border border-yellow-300 rounded-2xl p-4 text-center space-y-3">
              <p className="text-yellow-800 text-sm font-semibold">
                🚩 Thanks! Admin will get back to you shortly to help you. In the meantime, keep setting up your profile.
              </p>
              <Button onClick={onAmazing} className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-4 font-bold">
                Okay
              </Button>
            </div>
          ) : (
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={onNeedsHelp}
                disabled={sendingHelp}
                className="flex-1 rounded-full border-border text-muted-foreground text-xs py-5"
              >
                {sendingHelp ? "sending..." : "I'm confused and need help!"}
              </Button>
              <Button
                onClick={onAmazing}
                className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-full font-bold py-5"
              >
                Amazing!
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}