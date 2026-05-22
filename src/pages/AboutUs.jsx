import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const Accordion = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-800 text-sm">{title}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

const faqItems = [
  {
    q: "How does Cruise Kauaʻi work?",
    a: "Cruise Kauaʻi connects local drivers already making a trip with riders who need to get somewhere along the way. Drivers post their rides with a date, time, and route. Riders browse available rides and request a seat. Once confirmed, riders pay through the app and coordinate details via in-app chat."
  },
  {
    q: "Is Cruise Kauaʻi safe?",
    a: "The Cruise Kauaʻi community is made up of people who share a love for the island and a desire to help each other get around. Everyone who participates benefits from the system, so there's a strong incentive to treat others with aloha and respect. That said, users are encouraged to use their best judgment before booking with someone, review driver and rider profiles, and practice safe behavior during rides. Cruise Kauaʻi is not liable for any damages, losses, or injury arising from the use of the platform or any events related to a ride."
  },
  {
    q: "How are drivers verified?",
    a: "All drivers are required to upload a valid driver's license and vehicle insurance before posting rides. Our team reviews these documents manually. Drivers with expired or unverified documents are flagged and cannot post new rides until their documents are current."
  },
  {
    q: "Who can drive on Cruise Kauaʻi?",
    a: "Any Kauaʻi resident (or long-term visitor) with a valid driver's license, registered vehicle, and active insurance can sign up as a driver. Drivers must agree to our community guidelines and terms of service before their first ride."
  },
  {
    q: "How much does it cost?",
    a: "Ride prices are set by the driver and typically range from $5–$30 depending on the distance. Drivers set separate pricing for locals and tourists. A small connect fee (10%) is added to each booking to help keep the platform running."
  },
  {
    q: "How do I pay?",
    a: "Payment is handled securely through the app using Stripe. Riders pay by credit or debit card at the time of booking. Drivers receive their payout after the ride is completed."
  },
  {
    q: "Can I cancel a booking?",
    a: "Yes. Riders can cancel through the app. Refund eligibility depends on how far in advance you cancel: full refund if cancelled 24+ hours before the ride, 50% refund if cancelled 12–24 hours before, and no refund for cancellations under 12 hours. Drivers can also cancel rides, and affected passengers will be notified and refunded."
  },
  {
    q: "What if I'm having technical difficulties?",
    a: "If you're experiencing issues with the app — like a payment not going through, a booking not showing up, or trouble uploading documents — please use the Contact Us page to reach out. Include as much detail as possible (what you were trying to do, what happened) and we'll get back to you as soon as we can."
  },
  {
    q: "What if something goes wrong during a ride?",
    a: "If you feel unsafe or there's an emergency, call 911 first. For non-emergency concerns about a driver or passenger (rude behavior, no-show, etc.), please report it through the app or contact us directly. We take community reports seriously and will follow up."
  },
  {
    q: "Is this the same as a taxi or rideshare like Uber?",
    a: "No. Cruise Kauaʻi is a community carpooling platform — not a taxi or commercial rideshare service. Drivers are neighbors and community members making trips they were already planning. The shared cost helps cover gas, not a professional fare. This keeps prices low and keeps money in the local economy."
  },
];

export default function AboutUsPage() {
  return (
    <div className="p-4 md:p-8 bg-white min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">

        <div>
          <h1 className="text-3xl font-bold text-secondary">FAQ & about us</h1>
          <p className="text-gray-500 text-sm mt-1">everything you need to know about cruise kauaʻi</p>
        </div>

        {/* About Us Card */}
        <div className="border border-green-200 rounded-3xl overflow-hidden">
          <button
            onClick={() => {}}
            className="w-full p-5 bg-green-50 text-left"
          >
            <AboutUsAccordion />
          </button>
        </div>

        {/* FAQ Card */}
        <div className="border border-gray-200 rounded-3xl overflow-hidden">
          <div className="bg-white p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-secondary">frequently asked questions</h2>
            <p className="text-xs text-gray-500 mt-0.5">tap a question to see the answer</p>
          </div>
          <div className="p-4 space-y-3">
            {faqItems.map((item, i) => (
              <Accordion key={i} title={item.q}>
                {item.a}
              </Accordion>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function AboutUsAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-green-200 rounded-3xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left bg-green-50 hover:bg-green-100 transition-colors"
      >
        <span className="font-bold text-green-900 text-base">about us</span>
        <ChevronDown className={`w-5 h-5 text-green-700 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="bg-white border-t border-green-100 p-5 space-y-5">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <img
              src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/cedec1129_DC5F7FC1-3850-429F-BB9B-986B15078A46_1_105_c.jpeg"
              alt="Willow Volkert, founder of Cruise Kauaʻi"
              className="w-full sm:w-40 h-48 sm:h-40 object-cover rounded-2xl shadow-md shrink-0"
            />
            <p className="text-green-900 font-bold text-base leading-snug">
              Cruise Kauaʻi was founded by 23 year old Willow Volkert, who had struggled for years to get around the island with broken cars.
            </p>
          </div>
          <div className="space-y-3 text-gray-700 leading-relaxed text-sm">
            <p>She commuted Wailua to Waimea one year, then Hanapepe to Hāʻena the next — paying for gas, sitting in traffic, and listening to a lot of podcasts.</p>
            <p>In all that time, she wondered about carpooling. It would solve all her problems! Help pay for gas, reduce traffic, and give her someone to talk to on some of these long drives — not to mention helping someone out.</p>
            <p>Cruise Kauaʻi stayed as a theory to help the island for about a year, but with persistence, Willow learned how to build an app, and started turning ideas into reality.</p>
          </div>
          <div className="bg-green-900 text-white rounded-2xl p-5 space-y-2">
            <h3 className="font-extrabold uppercase tracking-wide text-sm">our mission</h3>
            <p className="text-green-100 text-sm leading-relaxed">
              To provide <strong className="text-white">accessible & affordable transportation options</strong> on Kauaʻi, reduce traffic, and divert more money into our local economy — one shared ride at a time.
            </p>
            <p className="text-green-300 text-sm italic">🤙 mahalo for being a part of the movement</p>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            We now have <strong>170 users on Kauaʻi</strong>, with consistent rides being posted across the island. We have started recruiting drivers on Oʻahu, and plan to launch there <strong>August 1!</strong>
          </p>
        </div>
      )}
    </div>
  );
}