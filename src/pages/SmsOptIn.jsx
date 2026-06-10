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

      {/* Opt-In Description */}
      <section className="w-full bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold text-green-900 mb-3">SMS / Text Message Notifications</h2>
        <p className="text-gray-800 mb-4 font-medium">
          Cruise Kauaʻi sends SMS text message notifications to members who provide their mobile phone number during account registration or in their account profile settings.
        </p>
        <p className="text-gray-700 mb-4">
          <strong>How you opt in:</strong> By entering your mobile phone number in your Cruise Kauaʻi account profile and saving it, you are expressly consenting to receive transactional SMS text messages from Cruise Kauaʻi at the phone number provided.
        </p>
        <p className="text-gray-700 text-sm">
          You can also opt in by texting <strong>START</strong> to our SMS number after receiving an initial message.
        </p>
      </section>

      {/* Types of messages */}
      <section className="w-full bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Types of Messages You Will Receive</h2>
        <p className="text-gray-600 text-sm mb-3">After opting in, you may receive the following transactional messages:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm">
          <li>Ride booking requests and confirmations</li>
          <li>Payment confirmations and receipts</li>
          <li>Ride reminders (day before your trip)</li>
          <li>Driver/rider match notifications</li>
          <li>Important account or safety alerts</li>
          <li>Cancellation notices</li>
        </ul>
      </section>

      {/* Key disclosures */}
      <section className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6 space-y-3">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Important Information</h2>
        <p className="text-gray-700 text-sm">
          <strong>Message frequency:</strong> Varies based on your activity on the platform (typically 1–5 messages per booking event).
        </p>
        <p className="text-gray-700 text-sm">
          <strong>Message &amp; data rates may apply.</strong> Standard SMS and data rates from your mobile carrier may apply. Cruise Kauaʻi does not charge for SMS messages.
        </p>
        <p className="text-gray-700 text-sm">
          <strong>To opt out / unsubscribe:</strong> Reply <strong>STOP</strong> to any text message at any time. You will receive one confirmation message and no further SMS messages will be sent to your number.
        </p>
        <p className="text-gray-700 text-sm">
          <strong>To opt back in:</strong> Reply <strong>START</strong> to resume receiving messages.
        </p>
        <p className="text-gray-700 text-sm">
          <strong>For help:</strong> Reply <strong>HELP</strong> to any message, or contact us at{" "}
          <a href="mailto:hello@cruisekauai.org" className="text-green-700 underline">hello@cruisekauai.org</a>.
        </p>
        <p className="text-gray-700 text-sm">
          <strong>Supported carriers:</strong> All major US carriers including AT&amp;T, Verizon, T-Mobile, Sprint, and others. Carrier support may vary.
        </p>
      </section>

      {/* Legal */}
      <section className="w-full text-sm text-gray-500 space-y-3 pb-8">
        <p>
          Cruise Kauaʻi operates as a peer-to-peer ridesharing platform for the Hawaiian Islands. SMS notifications are sent through Twilio. <strong>We do not share your phone number with third parties for marketing purposes.</strong>
        </p>
        <p>
          Your consent to receive SMS messages is not a condition of using the Cruise Kauaʻi platform or purchasing any services.
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