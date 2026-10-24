import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Phone } from "lucide-react";

export default function SmsOptIn() {
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [alreadyOptedIn, setAlreadyOptedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        setIsAuthenticated(true);
        if (user.phone_number) setPhone(user.phone_number);
        if (user.sms_notifications_enabled) setAlreadyOptedIn(true);
      } catch (e) {
        // Not logged in — form still works
      }
    };
    checkAuth();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !agreed) return;
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        await base44.auth.updateMe({
          phone_number: phone.trim(),
          sms_notifications_enabled: true,
          sms_opt_in_date: new Date().toISOString(),
        });
        setSubmitted(true);
      } else {
        // Always redirect to signup so phone gets linked to a real account
        const encoded = encodeURIComponent(phone.trim());
        window.location.href = `/RiderSignupFlow?phone=${encoded}`;
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-green-800 text-white py-8 px-6 text-center">
        <img
          src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
          alt="Cruise Kauaʻi"
          className="w-16 h-16 object-cover rounded-xl shadow mx-auto mb-3"
        />
        <h1 className="text-2xl font-bold">Cruise Kauaʻi</h1>
        <p className="text-green-200 text-sm mt-1">SMS Notifications Sign-Up</p>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-6">

        {submitted ? (
          <div className="bg-white border border-green-200 rounded-2xl p-8 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold text-green-800">SMS Opt-In Saved!</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              Your phone number has been saved. To complete your account setup and start using Cruise Kauaʻi, continue creating your profile.
            </p>
            <Button
              onClick={() => window.location.href = '/RiderSignupFlow'}
              className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl py-3 font-bold"
            >
              Continue Creating Your Account →
            </Button>
            <p className="text-xs text-gray-500 border-t pt-3 mt-3">
              Reply <strong>STOP</strong> to any message to unsubscribe. Message &amp; data rates may apply.
            </p>
          </div>
        ) : alreadyOptedIn ? (
          <div className="bg-white border border-green-200 rounded-2xl p-8 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto" />
            <h2 className="text-xl font-bold text-green-800">Already opted in</h2>
            <p className="text-gray-600 text-sm">
              SMS notifications are active on your account. Reply <strong>STOP</strong> to any message to unsubscribe.
            </p>
          </div>
        ) : (
          <>
            {/* --- Program Description --- */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">About This SMS Program</h2>
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong>Cruise Kauaʻi</strong> sends transactional SMS text messages to members who opt in. Messages are sent to notify you about activity on your account, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 text-sm mt-3 space-y-1">
                <li>Ride booking requests and confirmations</li>
                <li>Payment and receipt notifications</li>
                <li>Trip reminders (day-before and day-of)</li>
                <li>Driver or passenger match alerts</li>
                <li>New in-app messages from your driver or rider</li>
                <li>Important account or safety alerts</li>
              </ul>
              <p className="text-gray-700 text-sm mt-3">
                <strong>Message frequency:</strong> Varies. Typically 1–5 messages per booking event, plus periodic reminders.
              </p>
              <p className="text-gray-700 text-sm mt-1">
                <strong>Message &amp; data rates may apply</strong> depending on your carrier plan.
              </p>
            </div>

            {/* --- Opt-In Form --- */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Sign Up for SMS Notifications</h2>
              <p className="text-gray-500 text-sm mb-5">
                By completing this form you are providing your express written consent to receive recurring automated text messages from <strong>Cruise Kauaʻi</strong>.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="sms-phone" className="block text-sm font-semibold text-gray-800 mb-1">
                    Mobile Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="sms-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(808) 555-1234"
                    required
                    className="rounded-xl text-base"
                  />
                </div>

                {/* CTIA-compliant explicit opt-in checkbox */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="sms-consent"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-gray-400 accent-green-700 cursor-pointer shrink-0"
                    required
                  />
                  <label htmlFor="sms-consent" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                    By checking this box, I provide my express written consent to receive recurring automated transactional SMS text messages from <strong>Cruise Kauaʻi</strong> at the mobile phone number provided above. I understand these messages may include ride booking confirmations, trip reminders, payment receipts, and account notifications. I acknowledge that:
                    <br /><br />
                    • Consent is <strong>not</strong> required as a condition of purchase or use of any service.<br />
                    • Message &amp; data rates may apply.<br />
                    • Message frequency varies based on account activity.<br />
                    • I can opt out at any time by replying <strong>STOP</strong> to any message.<br />
                    • I can reply <strong>HELP</strong> for assistance or email <a href="mailto:hello@cruisekauai.org" className="text-green-700 underline">hello@cruisekauai.org</a>.<br />
                    • My phone number will not be shared with third parties for marketing purposes.
                    <br /><br />
                    I have read and agree to the{" "}
                    <a href="/privacypolicy" className="text-green-700 underline font-semibold" target="_blank" rel="noopener noreferrer">Privacy Policy</a>{" "}
                    and{" "}
                    <a href="/termsofservice" className="text-green-700 underline font-semibold" target="_blank" rel="noopener noreferrer">Terms of Service</a>.
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={!phone.trim() || !agreed || isLoading}
                  className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl py-3 font-bold text-base flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  {isLoading ? 'Saving...' : isAuthenticated ? 'Opt In to SMS Notifications' : 'Continue & Create Account'}
                </Button>

                {!isAuthenticated && (
                  <p className="text-xs text-gray-500 text-center">
                    You'll be taken to the account registration page. Your phone number and SMS consent will be recorded upon completing sign-up.
                  </p>
                )}
              </form>
            </div>
          </>
        )}

        {/* --- Always-Visible CTIA Disclosures --- */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-sm text-gray-600 space-y-2">
          <h3 className="font-bold text-gray-800 text-base mb-3">SMS Program Terms &amp; Disclosures</h3>
          <p><strong>Program name:</strong> Cruise Kauaʻi Ride Notifications</p>
          <p><strong>Message sender:</strong> Cruise Kauaʻi (cruisekauai.org)</p>
          <p><strong>Message types:</strong> Transactional — ride confirmations, reminders, payment receipts, account alerts.</p>
          <p><strong>Message frequency:</strong> Varies based on account activity. Typically 1–5 messages per booking event.</p>
          <p><strong>Cost:</strong> Message &amp; data rates may apply. Check with your mobile carrier.</p>
          <p><strong>To cancel:</strong> Reply <strong>STOP</strong> to any message. You will receive one final confirmation message, then no further messages will be sent.</p>
          <p><strong>To resume:</strong> Reply <strong>START</strong> to re-enable messages.</p>
          <p><strong>For help:</strong> Reply <strong>HELP</strong> to any message, or contact us at <a href="mailto:hello@cruisekauai.org" className="text-green-700 underline">hello@cruisekauai.org</a>.</p>
          <p><strong>Supported carriers:</strong> AT&amp;T, Verizon, T-Mobile, and most major US carriers. Carrier support may vary.</p>
          <p><strong>Privacy:</strong> We will not sell, rent, or share your phone number with third parties for marketing purposes. See our <a href="/privacypolicy" className="text-green-700 underline">Privacy Policy</a>.</p>
          <p><strong>Consent is not required</strong> to purchase or use any Cruise Kauaʻi service.</p>
        </div>

        <footer className="text-center text-xs text-gray-400 pb-8 space-y-1">
          <p>Cruise Kauaʻi · Kauaʻi, Hawaiʻi</p>
          <p>
            <a href="mailto:hello@cruisekauai.org" className="text-green-700 underline">hello@cruisekauai.org</a>
            {" · "}
            <a href="/privacypolicy" className="text-green-700 underline">Privacy Policy</a>
            {" · "}
            <a href="/termsofservice" className="text-green-700 underline">Terms of Service</a>
          </p>
        </footer>

      </div>
    </div>
  );
}