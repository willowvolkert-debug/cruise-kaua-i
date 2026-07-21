import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ExternalLink, MapPin, Trees, HandHeart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TOWNS = ["Hanalei", "Kīlauea", "Kapaʻa", "Līhuʻe", "Pōʻipu", "Waimea", "Online"];

const TOURS = [
  {
    name: "Kauaʻi Museum Tour",
    desc: "Learn more about Hawaiian culture & agriculture practices. No reservation needed — open M–F 9–4 and Sat 9–2. Free guided tours M–F at 10am.",
    url: "https://www.kauaimuseum.org/"
  },
  {
    name: "Kumano I Ke Ala — Kulaiwi Connection",
    desc: "Visitors program to learn about Hawaiian culture & agriculture in Waimea.",
    url: "https://kulaiwiconnection.com/"
  },
  {
    name: "Limahuli, McBryde & Allerton Gardens",
    desc: "National Tropical Botanical Gardens where you can learn about native & canoe crops and how they intertwine with Hawaiian culture. At McBryde Gardens, tour the Regenerative Organic Breadfruit Agroforest (ROBA) and help harvest once a week.",
    url: "https://ntbg.org/gardens/limahuli/"
  },
  {
    name: "Waipā Cultural Foodways Program",
    desc: "Try a variety of Hawaiian dishes & learn about Hawaiian agricultural & cultural resurgence movements. Book tours online.",
    url: "https://waipafoundation.org/food-and-farm-tours/"
  },
  {
    name: "Kauaʻi Farmacy",
    desc: "Tea tour in Kīlauea."
  }
];

const VOLUNTEER = [
  {
    name: "Kauaʻi Food Forest",
    desc: "Experience a growing food forest, open every Saturday from 10am–5pm.",
    url: "http://www.kauaifoodforest.org/"
  },
  {
    name: "Hoʻomalu Ke Kai",
    desc: "Different events and workdays most weekends.",
    url: "https://www.hoomalukekai.com/volunteer"
  },
  {
    name: "Waipā Community Workdays",
    desc: "Every fourth Saturday — get hands on.",
    url: "https://waipafoundation.org/volunteer/"
  }
];

function RecItem({ name, desc, url }) {
  return (
    <Card className="border-gray-200 rounded-3xl">
      <CardContent className="p-5 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-secondary text-lg leading-tight">{name}</h3>
          {url && (
            <a href={url} target="_blank" rel="noreferrer" className="shrink-0 text-primary hover:text-primary/80 transition-colors">
              <ExternalLink className="w-5 h-5" />
            </a>
          )}
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="text-xs text-primary underline underline-offset-2 break-all">
            {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        )}
      </CardContent>
    </Card>
  );
}

export default function CommunityRecommendations() {
  return (
    <div className="p-4 md:p-8 bg-white min-h-screen">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/community" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors">
          <ChevronLeft className="w-4 h-4" /> back to community
        </Link>

        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-secondary">Kauaʻi recommendations</h1>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            A donation-based resource created by Willow Volkert. Here are ways to authentically support &amp; give back to the island through your visit!
          </p>
        </div>

        {/* Local Food — towns */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-secondary">local food</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {TOWNS.map(town => (
              <span key={town} className="px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700">
                {town}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400">Spots are being added by community — check back soon for local food recommendations in each town.</p>
        </section>

        {/* Tour Recommendations */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Trees className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-secondary">tour recommendations</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {TOURS.map(t => <RecItem key={t.name} {...t} />)}
          </div>
        </section>

        {/* Volunteer Recommendations */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <HandHeart className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-secondary">volunteer recommendations</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {VOLUNTEER.map(v => <RecItem key={v.name} {...v} />)}
          </div>
        </section>
      </div>
    </div>
  );
}