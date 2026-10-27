import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ExternalLink, MapPin, Trees, HandHeart } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";

// Local food spots per town, sourced from Willow Volkert's Notion recommendations.
const LOCAL_FOOD = [
  {
    town: "Hanalei",
    spots: [
      { name: "Waipā", desc: "Tuesdays 2–5" },
      { name: "Hale Halawai", desc: "Saturdays 9–12" },
    ],
  },
  {
    town: "Kīlauea",
    spots: [
      { name: "Anaina Hou", desc: "Saturdays & Sundays 9–2" },
      { name: "ʻOhiʻohi (Kīlauea)", desc: "M–F 11–5; Sat 9–5" },
      { name: "Johnny's", desc: "M–Sat 9–5, all local produce" },
    ],
  },
  {
    town: "Kapaʻa",
    spots: [
      { name: "Kapaʻa Soccer Field", desc: "Wednesdays 3–5. Smack in the middle of Kapaʻa town — going south, pass Kountry Kitchen & Bubba's Burgers, on your left before the only traffic light; going north, pass the ABC store, drive through the light, take the next right and spot the field ahead." },
      { name: "Kapaʻa Coconut Marketplace", desc: "Tuesdays & Thursdays 9–1" },
    ],
  },
  {
    town: "Līhuʻe",
    spots: [
      { name: "Kukui Grove", desc: "Mondays 3–5:30" },
      { name: "Grove Farms (Līhuʻe)", desc: "Saturdays 9–12" },
    ],
  },
  {
    town: "Pōʻipu",
    spots: [
      { name: "Kukuiʻula Shops", desc: "Wednesdays 3:30–5:30" },
    ],
  },
  {
    town: "Waimea",
    spots: [
      { name: "Hale Puna", desc: "Thursdays" },
    ],
  },
  {
    town: "Online",
    spots: [
      { name: "Mālama Kauaʻi", desc: "Weekly deliveries — schedule online at kauailocalfood.com (best for regular visitors)", url: "https://kauailocalfood.com" },
    ],
  },
];

function LocalFood({ data }) {
  const [active, setActive] = React.useState(data[0]?.town);
  const town = data.find(t => t.town === active) || data[0];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {data.map(t => (
          <button
            key={t.town}
            type="button"
            onClick={() => setActive(t.town)}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              t.town === active
                ? "bg-primary text-white border-primary"
                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {t.town}
          </button>
        ))}
      </div>
      <div className="space-y-3 border-b-2 border-gray-200 pb-5 bg-white">
        {town.spots.map((s, i) => (
          <div key={i} className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <p className="font-medium text-secondary">{s.name}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
            </div>
            {s.url && (
              <a href={s.url} target="_blank" rel="noreferrer" className="shrink-0 text-primary hover:text-primary/80 transition-colors">
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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
    <Card className="shadow-none border-0 border-b-2 border-gray-200 rounded-none">
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
        <BackButton />

        <div className="text-center space-y-3">
          <h1 className="cruise-head tracking-widest text-4xl text-secondary leading-none">Kauaʻi recommendations</h1>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            A donation-based resource created by Willow Volkert. Here are ways to authentically support &amp; give back to the island through your visit!
          </p>
        </div>

        {/* Local Food — towns */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="cruise-head tracking-widest text-2xl text-secondary">local food</h2>
          </div>
          <LocalFood data={LOCAL_FOOD} />
        </section>

        {/* Tour Recommendations */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Trees className="w-5 h-5 text-primary" />
            <h2 className="cruise-head tracking-widest text-2xl text-secondary">tour recommendations</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {TOURS.map(t => <RecItem key={t.name} {...t} />)}
          </div>
        </section>

        {/* Volunteer Recommendations */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <HandHeart className="w-5 h-5 text-primary" />
            <h2 className="cruise-head tracking-widest text-2xl text-secondary">volunteer recommendations</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {VOLUNTEER.map(v => <RecItem key={v.name} {...v} />)}
          </div>
        </section>
      </div>
    </div>
  );
}