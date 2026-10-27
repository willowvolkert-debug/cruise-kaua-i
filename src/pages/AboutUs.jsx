import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const Accordion = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b-2 border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left bg-white select-none"
      >
        <span className="font-bold text-gray-800 text-lg">{title}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pb-4 text-base text-gray-700 leading-relaxed bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

const faqItems = [
  {
    q: "How does Cruise Hawaiʻi work?",
    a: "Cruise Hawaiʻi connects local drivers already making a trip with riders who need to get somewhere along the way. Drivers post their rides with a date, time, and route. Riders browse available rides and request a seat. Once confirmed, riders pay through the app and coordinate details via in-app chat."
  },
  {
    q: "Is this the same as a taxi or rideshare like Uber?",
    a: "No. Cruise Hawaiʻi is a community carpooling platform — not a taxi or commercial rideshare service. Drivers are neighbors and community members sharing trips they were already planning to make. The cost riders pay is purely cost-sharing — helping cover gas and expenses for the trip, not a professional fare or a source of profit. Cruise Hawaiʻi does not employ drivers; every driver is an independent community member choosing to share their ride."
  },
  {
    q: "Is Cruise Hawaiʻi safe?",
    a: "The Cruise Hawaiʻi community is made up of people who share a love for the island and a desire to help each other get around. Everyone who participates benefits from the system, so there's a strong incentive to treat others with aloha and respect. That said, users are encouraged to use their best judgment before booking with someone, review driver and rider profiles, and practice safe behavior during rides. Cruise Hawaiʻi is not liable for any damages, losses, or injury arising from the use of the platform or any events related to a ride."
  },
  {
    q: "How are drivers verified?",
    a: "All drivers are required to upload a valid driver's license and vehicle insurance before posting rides. Our team reviews these documents manually. Drivers with expired or unverified documents are flagged and cannot post new rides until their documents are current."
  },
  {
    q: "Who can drive on Cruise Hawaiʻi?",
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
    a: "If you're experiencing issues with the app — like a payment not going through, a booking not showing up, or trouble uploading documents — please use the Contact Us page to reach out. Include as much detail as possible (what you were trying to do, what happened), and attach screenshots of the issue if possible. We'll get back to you as soon as we can."
  },
  {
    q: "What if something goes wrong during a ride?",
    a: "If you feel unsafe or there's an emergency, call 911 first. For non-emergency concerns about a driver or passenger (rude behavior, no-show, etc.), please report it through the app or contact us directly. We take community reports seriously and will follow up."
  },
];

export default function AboutUsPage() {
  return (
    <div className="p-4 md:p-8 bg-white min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">

        <div>
          <h1 className="cruise-head tracking-widest text-4xl text-secondary leading-none">FAQ & about us</h1>
          <p className="text-gray-900 text-lg mt-1">everything you need to know about cruise hawaiʻi</p>
        </div>

        {/* FAQ Card (dropdown) */}
        <FaqAccordion />

        {/* About Us Card (dropdown) */}
        <AboutUsAccordion />

      </div>
    </div>
  );
}

function FaqAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b-2 border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left bg-white select-none"
      >
        <span className="cruise-head tracking-widest text-2xl text-secondary">frequently asked questions</span>
        <ChevronDown className={`w-6 h-6 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="bg-white pb-4 space-y-1">
          <p className="text-base text-gray-500">tap a question to see the answer</p>
          {faqItems.map((item, i) => (
            <Accordion key={i} title={item.q}>
              {item.a}
            </Accordion>
          ))}
        </div>
      )}
    </div>
  );
}

function AboutUsAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b-2 border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left bg-white select-none"
      >
        <span className="cruise-head tracking-widest text-2xl text-secondary">about us</span>
        <ChevronDown className={`w-6 h-6 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="bg-white pb-5 space-y-5">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <img
              src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/cedec1129_DC5F7FC1-3850-429F-BB9B-986B15078A46_1_105_c.jpeg"
              alt="Willow Volkert, founder of Cruise Hawaiʻi"
              className="w-full sm:w-40 h-48 sm:h-40 object-cover rounded-lg shrink-0"
            />
            <p className="text-secondary font-bold text-xl leading-snug">
              Cruise Hawaiʻi was founded by 23 year old Willow Volkert, who had struggled for years to get around the island with broken cars.
            </p>
          </div>
          <div className="space-y-3 text-gray-700 leading-relaxed text-lg">
            <p>She commuted Wailua to Waimea one year, then Hanapepe to Hāʻena the next — paying for gas, sitting in traffic, and listening to a lot of podcasts.</p>
            <p>In all that time, she wondered about carpooling. It would solve all her problems! Help pay for gas, reduce traffic, and give her someone to talk to on some of these long drives — not to mention helping someone out.</p>
            <p>6 months after moving closer to work, Willow decided. to build a platform to make transportation easier for everyone. 9 months later, she launched the service and it went viral. We now have a small team of committed volunteers working to connect Hawaiʻi through this service</p>
            <p>Interested in supporting, check out our gofund me here</p>
            <a
              href="https://www.gofundme.com/f/support-cruise-hawaiis-community-carpool-launch"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-16 leading-[4rem] text-center text-xl font-bold rounded-lg bg-primary hover:bg-primary/90 text-white select-none"
            >
              donate now
            </a>
          </div>
          <div className="border-t-2 border-gray-200 pt-5 space-y-2">
            <h3 className="cruise-head tracking-widest text-2xl text-secondary">our mission</h3>
            <p className="text-gray-700 text-lg leading-relaxed">
              To provide <strong>accessible & affordable transportation options</strong> on Kauaʻi, reduce traffic, and divert more money into our local economy — one shared ride at a time.
            </p>
            <p className="text-gray-500 text-lg italic">🤙 mahalo for being a part of the movement</p>
          </div>
        </div>
      )}
    </div>
  );
}