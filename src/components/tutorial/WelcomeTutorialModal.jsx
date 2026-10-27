import React, { useState, useEffect, useRef } from "react";
import { X, ArrowRight, Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { sendInstallHelpEmail } from "@/functions/sendInstallHelpEmail";
import SkiesCard from "@/components/welcome/SkiesCard";

// ── Page 1: How It Works ────────────────────────────────────────────────────
function HowItWorksPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="cruise-head text-3xl text-secondary leading-tight">how it works 🌺</h1>
        <p className="text-muted-foreground text-sm mt-1">a community carpooling service built for Hawaiʻi</p>
      </div>

      {/* Driver + Rider */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted border border-border rounded-2xl p-4 space-y-2 text-center">
          <p className="text-3xl">🚗</p>
          <p className="font-bold text-foreground text-sm">Drivers</p>
          <p className="text-muted-foreground text-xs leading-relaxed">Share rides you're already making & cover your gas.</p>
        </div>
        <div className="bg-muted border border-border rounded-2xl p-4 space-y-2 text-center">
          <p className="text-3xl">🙋</p>
          <p className="font-bold text-foreground text-sm">Riders</p>
          <p className="text-muted-foreground text-xs leading-relaxed">Find affordable rides from locals. Just $5–$30 per ride.</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {[
          { icon: "👤", text: "Create your profile — takes about 2 minutes" },
          { icon: "🪪", text: "Verify your ID — we review within 24 hrs" },
          { icon: "🔍", text: "Find a ride on Get a Ride, or share yours on Post a Ride" },
          { icon: "💳", text: "Pay & communicate securely in the app" },
          { icon: "⭐", text: "Rate your driver or rider after the trip" },
        ].map(({ icon, text }) => (
          <div key={icon} className="flex items-start gap-3 bg-muted rounded-2xl px-4 py-3">
            <span className="text-lg shrink-0">{icon}</span>
            <p className="text-sm text-foreground">{text}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center italic">Less cars on the road & more money in locals' pockets 🌿</p>
    </div>
  );
}

// ── Get a Ride ───────────────────────────────────────────────────────────────
function GetRideTutorial() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="cruise-head text-3xl text-secondary leading-tight">get a ride 🔍</h1>
        <p className="text-muted-foreground text-sm mt-1">find a local driver heading your way</p>
      </div>

      <div className="bg-muted border border-border rounded-2xl p-4 space-y-2">
        <p className="font-bold text-foreground text-sm">browse rides posted by drivers:</p>
        <ul className="text-xs text-foreground space-y-1 ml-2">
          <li>📅 <strong>By date</strong> — pick a day and see what's available</li>
          <li>📍 <strong>By route</strong> — type where you're starting and where you're headed</li>
        </ul>
        <p className="text-xs text-foreground pt-1">Tap a ride to see the driver, the price, and book your seat.</p>
      </div>

      <div className="bg-muted border border-border rounded-2xl p-4 space-y-2">
        <p className="font-bold text-foreground text-sm">🙋 don't see a ride that fits?</p>
        <p className="text-xs text-foreground">Tap <strong>request a ride</strong> to tell drivers where and when you need to go. Need the same ride every week? Save it as a <strong>recurring ride request</strong> so you only pick the date.</p>
      </div>
    </div>
  );
}

// ── Post a Ride ──────────────────────────────────────────────────────────────
function PostRideTutorial() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="cruise-head text-3xl text-secondary leading-tight">post a ride 🚗</h1>
        <p className="text-muted-foreground text-sm mt-1">share a trip you're already making & cover your gas</p>
      </div>

      <div className="bg-muted border border-border rounded-2xl p-4 space-y-2">
        <p className="font-bold text-foreground text-sm">how to post:</p>
        <ul className="text-xs text-foreground space-y-1 ml-2">
          <li>📍 Enter where you're leaving from and heading to</li>
          <li>🕒 Pick the date and time</li>
          <li>💺 Choose how many seats and your price per seat</li>
        </ul>
        <p className="text-xs text-foreground pt-1">Riders can message you and book. You'll be notified in your Inbox.</p>
      </div>

      <div className="bg-muted border border-border rounded-2xl p-4 space-y-2">
        <p className="font-bold text-foreground text-sm">🔁 same drive every week?</p>
        <p className="text-xs text-foreground">Save it as a <strong>recurring trip</strong>, pick the days of the week you're driving, and turn on <strong>post automatically</strong> so your ride goes up on its own.</p>
      </div>
    </div>
  );
}

// ── Page 3: Price Bidding ──────────────────────────────────────────────────
function PriceBiddingTutorial() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="cruise-head text-3xl text-secondary leading-tight">price offers 💸</h1>
        <p className="text-muted-foreground text-sm mt-1">riders can offer a lower price — drivers choose to accept or not</p>
      </div>

      <div className="bg-muted border border-border rounded-2xl p-4 space-y-3">
        <p className="font-bold text-foreground text-sm">how it works for riders:</p>
        <div className="space-y-2 text-sm text-foreground">
          <div className="flex gap-2 items-start">
            <span>1️⃣</span>
            <p>When booking, you can offer a <strong>lower price</strong> than what the driver listed.</p>
          </div>
          <div className="flex gap-2 items-start">
            <span>2️⃣</span>
            <p>The driver reviews your offer and either <strong>accepts</strong> it or <strong>requests full fare</strong>.</p>
          </div>
          <div className="flex gap-2 items-start">
            <span>3️⃣</span>
            <p>If they request full fare, you'll get a notification in your <strong>Inbox</strong> to accept or decline.</p>
          </div>
        </div>
      </div>

      <div className="bg-muted border border-border rounded-2xl p-4 space-y-3">
        <p className="font-bold text-foreground text-sm">how it works for drivers:</p>
        <div className="space-y-2 text-sm text-foreground">
          <div className="flex gap-2 items-start">
            <span>✅</span>
            <p><strong>Accept the lower offer</strong> — the rider is charged their bid price</p>
          </div>
          <div className="flex gap-2 items-start">
            <span>💰</span>
            <p><strong>Request full fare</strong> — let the rider know you'd like your listed price</p>
          </div>
        </div>
      </div>

      <div className="bg-muted border border-border rounded-2xl p-3">
        <p className="text-xs text-foreground">
          <strong>Tip:</strong> Price offers are optional — you can always book at the driver's listed price with no negotiation.
        </p>
      </div>
    </div>
  );
}

// ── Page 2: Install the App ─────────────────────────────────────────────────
function InstallAppPage({ onConfused }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="cruise-head text-3xl text-secondary leading-tight">install the app 📲</h1>
        <p className="text-muted-foreground text-sm mt-1 font-medium">
          we don't need the app store anymore! you can install this app right here, right now.
        </p>
      </div>

      {/* iPhone instructions */}
      <div className="bg-muted border border-border rounded-2xl p-4 space-y-3">
        <p className="font-bold text-foreground text-sm">🍎 iPhone (Safari)</p>
        <ol className="space-y-2 text-sm text-foreground list-decimal list-inside leading-relaxed">
          <li>
            Look for the <strong>Share button</strong> at the bottom of your browser —
            it looks like this:
            <span className="inline-flex items-center justify-center w-7 h-7 mx-1 bg-blue-100 rounded-lg border border-blue-300 align-middle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </span>
          </li>
          <li>Scroll down in the menu and tap <strong>"Add to Home Screen"</strong></li>
          <li>Tap <strong>"Add"</strong> — done! 🎉</li>
        </ol>
        <p className="text-xs text-blue-600 border border-blue-300 rounded-xl px-3 py-2 bg-white/60">
          You may have to press on the <strong>...</strong> to see this option
        </p>
      </div>

      {/* Android instructions */}
      <div className="bg-muted border border-border rounded-2xl p-4 space-y-2">
        <p className="font-bold text-foreground text-sm">🤖 Android (Chrome)</p>
        <ol className="space-y-1.5 text-sm text-foreground list-decimal list-inside leading-relaxed">
          <li>Tap the <strong>⋮ menu</strong> (three dots) in the top-right of Chrome</li>
          <li>Tap <strong>"Add to Home screen"</strong> → <strong>"Add"</strong></li>
        </ol>
      </div>

      <p className="text-xs text-center text-muted-foreground italic">🤙 mahalo for being a part of the movement</p>
    </div>
  );
}

// ── Page 5: More Questions ──────────────────────────────────────────────────
function MoreQuestionsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="cruise-head text-3xl text-secondary leading-tight">more questions? 🤙</h1>
        <p className="text-muted-foreground text-sm mt-1">we're here to help — reach out anytime</p>
      </div>

      <div className="space-y-3">
        <a
          href="/aboutus"
          className="flex items-start gap-3 bg-muted border border-border rounded-2xl px-4 py-4 hover:bg-blue-100 transition-colors"
        >
          <span className="text-2xl shrink-0">❓</span>
          <div>
            <p className="font-bold text-foreground text-sm">FAQ & About Us</p>
            <p className="text-xs text-muted-foreground mt-0.5">Answers to the most common questions about how Cruise Hawaiʻi works.</p>
          </div>
        </a>

        <a
          href="/contactus"
          className="flex items-start gap-3 bg-muted border border-border rounded-2xl px-4 py-4 hover:bg-green-100 transition-colors"
        >
          <span className="text-2xl shrink-0">✉️</span>
          <div>
            <p className="font-bold text-foreground text-sm">Contact Us</p>
            <p className="text-xs text-muted-foreground mt-0.5">Send us a message directly through the app and we'll get back to you.</p>
          </div>
        </a>

        <a
          href="mailto:cruisekauai@gmail.com"
          className="flex items-start gap-3 bg-muted border border-border rounded-2xl px-4 py-4 hover:bg-amber-100 transition-colors"
        >
          <span className="text-2xl shrink-0">📧</span>
          <div>
            <p className="font-bold text-amber-900 text-sm">Email Us</p>
            <p className="text-xs text-muted-foreground mt-0.5">cruisekauai@gmail.com</p>
          </div>
        </a>
      </div>

      <p className="text-xs text-muted-foreground text-center italic">mahalo for being part of our community 🌺</p>
    </div>
  );
}

// ── Main Modal ──────────────────────────────────────────────────────────────
const PAGES = ["how_it_works", "skies", "get_ride", "post_ride", "price_bidding", "install_app", "more_questions"];

export default function WelcomeTutorialModal({ isOpen, onClose, onComplete }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [confusedLoading, setConfusedLoading] = useState(false);
  const [confusedDone, setConfusedDone] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPageIndex(0);
      setConfusedDone(false);
    }
  }, [isOpen]);

  // Scroll content to top on page change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [pageIndex]);

  if (!isOpen) return null;

  const isLast = pageIndex === PAGES.length - 1;
  const currentPage = PAGES[pageIndex];

  const handleDone = () => {
    onClose();
    if (onComplete) onComplete();
  };

  const handleConfused = async () => {
    setConfusedLoading(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      // Submit a ContactInquiry
      await base44.entities.ContactInquiry.create({
        user_id: user?.id || "anonymous",
        user_name: user?.full_name || "Anonymous",
        user_email: user?.email || "unknown",
        subject: "Help installing the app",
        message: "I'm having trouble adding Cruise Hawaiʻi to my home screen as an app.",
        priority: "low",
      });
      // Send the detailed help email
      if (user?.email) {
        await sendInstallHelpEmail({ email: user.email, name: user.full_name });
      }
    } catch (e) {
      // non-critical
    }
    setConfusedLoading(false);
    setConfusedDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card rounded-3xl shadow-2xl border-2 border-foreground/10 w-full max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <div className="flex gap-1.5 items-center">
            {PAGES.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === pageIndex ? "bg-primary w-6" : idx < pageIndex ? "bg-primary/40 w-2" : "bg-border w-2"
                }`}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-muted hover:bg-border transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-2">
          {currentPage === "how_it_works" && <HowItWorksPage />}
          {currentPage === "skies" && <SkiesCard onContinue={() => setPageIndex(p => p + 1)} />}
          {currentPage === "get_ride" && <GetRideTutorial />}
          {currentPage === "post_ride" && <PostRideTutorial />}
          {currentPage === "price_bidding" && <PriceBiddingTutorial />}
          {currentPage === "install_app" && <InstallAppPage />}
          {currentPage === "more_questions" && <MoreQuestionsPage />}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 shrink-0 border-t border-gray-100 space-y-3">
          {/* Confused state feedback */}
          {currentPage === "install_app" && confusedDone && (
            <p className="text-center text-sm text-muted-foreground font-medium bg-green-50 rounded-2xl px-4 py-2">
              ✅ Got it! We sent a step-by-step guide to your email.
            </p>
          )}

          <div className={`flex items-center gap-3 ${currentPage === "skies" ? "hidden" : ""}`}>
            {/* Left button */}
            {currentPage === "how_it_works" && (
              <div className="flex-1" />
            )}
            {currentPage === "install_app" && !confusedDone && (
              <Button
                variant="outline"
                onClick={handleConfused}
                disabled={confusedLoading}
                className="flex-1 rounded-full border-green-400 text-muted-foreground hover:bg-green-50 text-sm px-3"
              >
                {confusedLoading ? "sending..." : "I'm confused, help please!"}
              </Button>
            )}
            {currentPage === "install_app" && confusedDone && (
              <Button
                variant="outline"
                onClick={() => setPageIndex(p => p - 1)}
                className="rounded-full border-border text-muted-foreground px-4"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> back
              </Button>
            )}

            {/* Right button */}
            <Button
              onClick={isLast ? handleDone : () => setPageIndex(p => p + 1)}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full font-bold py-5"
            >
              {isLast ? (
                onComplete ? <>finish my profile <ArrowRight className="w-4 h-4 ml-1" /></> : <><Check className="w-4 h-4 mr-1" /> got it!</>
              ) : (
                <>got it <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>

          {/* Back navigation — available on all pages except the first */}
          {pageIndex > 0 && !(currentPage === "install_app" && confusedDone) && (
            <button
              onClick={() => setPageIndex(p => p - 1)}
              className="w-full text-center text-xs text-muted-foreground hover:text-muted-foreground transition-colors"
            >
              ← back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}