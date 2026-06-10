import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, MessageSquare } from "lucide-react";

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
        // Not logged in — form still works as informational
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
      }
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start px-6 py-12 max-w-2xl mx-auto">
      {/* Logo */}
      <img
        src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
        alt="Cruise Kauaʻi logo"
        className="w-24 h-24 object-cover rounded-2xl shadow mb-6"
      />
      <h1 className="text-3xl font-bold text-green-800 mb-1 text-center">Cruise Kauaʻi</h1>
      <p className="text-gray-500 text-center mb-10 text-sm">sharing aloha one ride at a time</p>

      {submitted ? (
        <div className="w-full bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold text-green-800">You're opted in!</h2>
          <p className="text-gray-700">
            You'll now receive SMS notifications from Cruise Kauaʻi for ride bookings, confirmations, and reminders.
          </p>
          <p className="text-sm text-gray-500">
            Reply <strong>STOP</strong> at any time to unsubscribe. Message &amp; data rates may apply.
          </p>
        </div>
      ) : alreadyOptedIn ? (
        <div className="w-full bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-3">
          <CheckCircle className="w-10 h-10 text-green-600 mx-auto" />
          <h2 className="text-xl font-bold text-green-800">SMS notifications already enabled</h2>
          <p className="text-gray-600 text-sm">
            Your phone number is on file and SMS notifications are active. Reply <strong>STOP</strong> to any message to unsubscribe.
          </p>
        </div>
      ) : (
        <>
          {/* Opt-In Form */}
          <section className="w-full bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-6 h-6 text-green-700" />
              <h2 className="text-xl font-bold text-green-900">Opt In to SMS Notifications</h2>
            </div>
            <p className="text-gray-700 text-sm mb-5">
              Enter your mobile number below to receive transactional text messages from <strong>Cruise Kauaʻi</strong> about your ride bookings, confirmations, and reminders.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">
                  Mobile Phone Number *
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. (808) 555-1234"
                  required
                  className="rounded-xl"
                />
              </div>

              {/* Explicit consent checkbox — NOT pre-checked */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="sms-consent"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-400 accent-green-700 cursor-pointer"
                  required
                />
                <label htmlFor="sms-consent" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                  I agree to receive recurring automated transactional SMS text messages from <strong>Cruise Kauaʻi</strong> at the mobile number provided above, including ride booking confirmations, reminders, and notifications. Consent is not a condition of use. Message frequency varies. Message &amp; data rates may apply. Reply <strong>STOP</strong> to unsubscribe at any time. Reply <strong>HELP</strong> for help. View our{" "}
                  <a href="/privacypolicy" className="text-green-700 underline">Privacy Policy</a>{" "}
                  and{" "}
                  <a href="/termsofservice" className="text-green-700 underline">Terms of Service</a>.
                </label>
              </div>

              <Button
                type="submit"
                disabled={!phone.trim() || !agreed || isLoading}
                className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl py-3 font-semibold"
              >
                {isLoading ? 'Saving...' : 'Opt In to SMS Notifications'}
              </Button>
            </form>
          </section>

          {/* What you'll receive */}
          <section className="w-full bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-3">Types of messages you may receive:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
              <li>Ride booking requests and confirmations</li>
              <li>Payment confirmations and receipts</li>
              <li>Ride reminders (day before your trip)</li>
              <li>Driver/rider match notifications</li>
              <li>New messages from your driver or passenger</li>
              <li>Important account or safety alerts</li>
            </ul>
          </section>
        </>
      )}

      {/* Always-visible disclosures */}
      <section className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 space-y-2 text-sm text-gray-600">
        <h3 className="font-bold text-gray-700 mb-2">SMS Program Details</h3>
        <p><strong>Message frequency:</strong> Varies based on platform activity (typically 1–5 messages per booking event).</p>
        <p><strong>Message &amp; data rates may apply</strong> depending on your mobile carrier plan.</p>
        <p><strong>To stop messages:</strong> Reply <strong>STOP</strong> to any message. You'll receive one confirmation, then no further messages.</p>
        <p><strong>To restart messages:</strong> Reply <strong>START</strong>.</p>
        <p><strong>For help:</strong> Reply <strong>HELP</strong> or email <a href="mailto:hello@cruisekauai.org" className="text-green-700 underline">hello@cruisekauai.org</a>.</p>
        <p><strong>Supported carriers:</strong> AT&amp;T, Verizon, T-Mobile, Sprint, and most major US carriers. Carrier support may vary.</p>
        <p><strong>Privacy:</strong> We do not share your phone number with third parties for marketing purposes.</p>
        <p><strong>Consent is not required</strong> to use the Cruise Kauaʻi platform or any of its services.</p>
      </section>

      <section className="w-full text-xs text-gray-400 space-y-1 pb-8">
        <p>
          For more information, review our{" "}
          <a href="/privacypolicy" className="text-green-700 underline">Privacy Policy</a>{" "}
          and{" "}
          <a href="/termsofservice" className="text-green-700 underline">Terms of Service</a>.
        </p>
        <p>Cruise Kauaʻi · Kauaʻi, Hawaiʻi · hello@cruisekauai.org</p>
      </section>
    </div>
  );
}