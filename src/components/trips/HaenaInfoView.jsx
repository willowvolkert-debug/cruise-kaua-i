import React from "react";
import { ChevronLeft, ExternalLink, Bus, Car, PersonStanding } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Brief bio for gohaena.com — the official Hāʻena State Park access portal.
const OPTIONS = [
  {
    icon: Bus,
    title: "Shuttle + Entry Pass",
    desc: "Most convenient option with the most availability. Free parking at Waipā Park & Ride in Hanalei (shuttles every 20 min, 6:20am–12:40pm), or pickup at Princeville Makai Golf Club (7:00am & 9:00am departures — no parking at this stop)."
  },
  {
    icon: Car,
    title: "Parking + Entry Pass",
    desc: "Very limited parking inside the park — reservations sell out quickly. Morning (6:30–12:30), afternoon (12:30–5:30), and evening (4:30–sunset) slots."
  },
  {
    icon: PersonStanding,
    title: "Entry Pass Only",
    desc: "For Hawaiʻi residents or visitors walking or biking in. Parking outside the park violates the purchase terms."
  }
];

export default function HaenaInfoView({ onBack }) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> back to request a ride
      </button>

      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-secondary">Hāʻena State Park access</h2>
        <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Hāʻena State Park <span className="font-semibold">requires advance reservations</span> for all visitors —
          whether you're snorkeling Keʻe Beach or hiking the Kalalau Trail. Reservations are managed through{" "}
          <a
            href="https://gohaena.com"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2 font-medium"
          >
            gohaena.com
          </a>
          , the official park access portal, and they sell out fast — book ahead to secure your spot.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {OPTIONS.map(opt => (
          <Card key={opt.title} className="border-gray-200 rounded-3xl">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-2xl">
                  <opt.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-secondary text-base leading-tight">{opt.title}</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{opt.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20 bg-primary/5 rounded-3xl">
        <CardContent className="p-5 space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            Once you've reserved your Hāʻena pass below, come back here and request a ride to get between Princeville,
            Hanalei, and the park — a driver may be heading that way and can drop you at the shuttle stop or park
            entrance.
          </p>
        </CardContent>
      </Card>

      <div className="text-center pb-4">
        <Button asChild className="bg-primary hover:bg-primary/90 rounded-2xl">
          <a href="https://gohaena.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
            open gohaena.com <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}