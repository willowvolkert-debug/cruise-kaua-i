import React from "react";

export default function AboutUsPage() {
  return (
    <div className="p-4 md:p-8 bg-white min-h-screen">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-secondary">about us</h1>
          <p className="text-gray-500 text-sm mt-1">the story behind cruise kauaʻi</p>
        </div>

        {/* Founder section */}
        <div className="bg-green-50 border border-green-200 rounded-3xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <img
              src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/cedec1129_DC5F7FC1-3850-429F-BB9B-986B15078A46_1_105_c.jpeg"
              alt="Willow Volkert, founder of Cruise Kauaʻi"
              className="w-full sm:w-48 h-56 sm:h-48 object-cover rounded-2xl shadow-md shrink-0"
            />
            <div>
              <p className="text-green-900 font-bold text-lg leading-snug">
                Cruise Kauaʻi was founded by 23 year old Willow Volkert, who had struggled for years to get around the island with broken cars.
              </p>
            </div>
          </div>
        </div>

        {/* Story */}
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            She commuted Wailua to Waimea one year, then Hanapepe to Hāʻena the next — paying for gas, sitting in traffic, and listening to a lot of podcasts.
          </p>
          <p>
            In all that time, she wondered about carpooling. It would solve all her problems! Help pay for gas, reduce traffic, and give her someone to talk to on some of these long drives — not to mention helping someone out.
          </p>
          <p>
            cruise kauaʻi stayed as a theory to help the island for about a year, but with persistence, willow learned how to build an app, and started turning ideas into reality.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Mission */}
        <div className="bg-green-900 text-white rounded-3xl p-6 space-y-3">
          <h2 className="text-xl font-extrabold uppercase tracking-wide">our mission</h2>
          <p className="text-green-100 leading-relaxed text-sm">
            To provide <strong className="text-white">accessible & affordable transportation options</strong> on Kauaʻi, reduce traffic, and divert more money into our local economy — one shared ride at a time.
          </p>
          <p className="text-green-300 text-sm italic">🤙 mahalo for being a part of the movement</p>
        </div>

      </div>
    </div>
  );
}