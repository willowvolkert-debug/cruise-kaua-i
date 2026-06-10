import React from "react";

export default function SmsOptIn() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start px-6 py-12 max-w-2xl mx-auto">
      {/* Logo */}
      <img
        src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
        alt="Cruise Kauaʻi logo"
        className="w-24 h-24 object-cover rounded-2xl shadow mb-6"
      />

      <h1 className="text-3xl font-bold text-green-800 mb-2 text-center">Cruise Kauaʻi</h1>
      <p className="text-gray-500 text-center mb-10 text-sm">sharing aloha one ride at a time</p>

      {/* SMS Program */}
      <section className="w-full bg-green-50 border border-green-200 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold text-green-900 mb-3">SMS Messaging Program</h2>
        <p className="text-gray-700 mb-4">
          By providing your phone number and using Cruise Kauaʻi, you agree to receive text messages
          from Cruise Kauaʻi regarding your ride bookings, confirmations, reminders, and platform updates.
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm mb-4">
          <li><strong>Message frequency:</strong> Varies based on your activity (typically 1–5 messages per booking).</li>
          <li><strong>Message &amp; data rates may apply</strong> depending on your carrier plan.</li>
          <li>Messages are sent to the phone number provided in your Cruise Kauaʻi account profile.</li>
        </ul>
        <p className="text-gray-700 text-sm">
          <strong>To opt out:</strong> Reply <strong>STOP</strong> to any text message at any time. You will receive a
          one-time confirmation and no further messages will be sent.
        </p>
        <p className="text-gray-700 text-sm mt-2">
          <strong>To opt back in:</strong> Reply <strong>START</strong> to resume messages.
        </p>
        <p className="text-gray-700 text-sm mt-2">
          <strong>For help:</strong> Reply <strong>HELP</strong> or contact us at{" "}
          <a href="mailto:hello@cruisekauai.org" className="text-green-700 underline">hello@cruisekauai.org</a>.
        </p>
      </section>

      {/* Types of messages */}
      <section className="w-full bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Types of Messages You May Receive</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm">
          <li>Ride booking requests and confirmations</li>
          <li>Payment confirmations</li>
          <li>Ride reminders (day before your trip)</li>
          <li>Driver/rider match notifications</li>
          <li>Important account or safety alerts</li>
        </ul>
      </section>

      {/* Legal */}
      <section className="w-full text-sm text-gray-500 space-y-2">
        <p>
          Cruise Kauaʻi operates as a peer-to-peer ridesharing platform for the Hawaiian Islands. SMS notifications
          are sent through Twilio. We never share your phone number with third parties for marketing purposes.
        </p>
        <p>
          For more information, please review our{" "}
          <a href="/privacypolicy" className="text-green-700 underline">Privacy Policy</a>{" "}
          and{" "}
          <a href="/termsofservice" className="text-green-700 underline">Terms of Service</a>.
        </p>
        <p className="pt-2 text-xs text-gray-400">
          Cruise Kauaʻi · Kauaʻi, Hawaiʻi · hello@cruisekauai.org
        </p>
      </section>
    </div>
  );
}