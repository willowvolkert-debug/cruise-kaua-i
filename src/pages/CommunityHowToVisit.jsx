import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ExternalLink, PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const YOUTUBE_CHANNEL = "https://www.youtube.com/@kauaivisitorsbureau5320/videos";

export default function CommunityHowToVisit() {
  return (
    <div className="p-4 md:p-8 bg-white min-h-screen">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/communityvisitorguide" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors">
          <ChevronLeft className="w-4 h-4" /> back to visitor guide
        </Link>

        <div className="space-y-3">
          <h1 className="cruise-head tracking-widest text-4xl text-secondary leading-none">how to visit Kauaʻi</h1>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Arrive informed. Here's how to travel to Kauaʻi in a way that respects the island, its people, and its resources.
          </p>
        </div>

        {/* DMAP description */}
        <Card className="shadow-none border-0 border-b-2 border-gray-200 rounded-none bg-white">
          <CardContent className="p-6 space-y-4">
            <h2 className="cruise-head tracking-widest text-2xl text-secondary">Destination Management Action Plan</h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                The Kauaʻi Visitors Bureau — an island chapter of the Hawaiʻi Visitors &amp; Convention Bureau — helps carry out the island's <strong>Destination Management Action Plan (DMAP)</strong>, a community-driven roadmap for managing tourism in a way that protects Kauaʻi's natural and cultural resources for generations to come.
              </p>
              <p>
                A core goal of the DMAP is to <strong>provide visitor education tools</strong> — helping travelers understand how to visit responsibly before they arrive, from respecting sacred and cultural sites to protecting reefs and wildlife. The plan focuses on regenerative tourism that gives back to the island rather than simply drawing from it.
              </p>
              <p>
                Explore the resources below to learn how to be a mindful guest during your time on Kauaʻi.
              </p>
            </div>
            <a
              href="https://www.gohawaii.com/kauai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              visit gohawaii.com/kauai <ExternalLink className="w-4 h-4" />
            </a>
          </CardContent>
        </Card>

        {/* YouTube integration */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-primary" />
              <h2 className="cruise-head tracking-widest text-2xl text-secondary">Kauaʻi Visitors Bureau on YouTube</h2>
            </div>
            <a
              href={YOUTUBE_CHANNEL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/90 transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> visit channel
            </a>
          </div>

          <div className="aspect-video w-full rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
            <iframe
              src="https://www.youtube.com/embed/videoseries?list=UUQUI-9C_HrdU7j0RZN0um_Q"
              title="Kauaʻi Visitors Bureau videos"
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-xs text-gray-400 text-center">
            Can't see the videos? <a href={YOUTUBE_CHANNEL} target="_blank" rel="noreferrer" className="text-primary underline">Open the channel directly on YouTube</a>.
          </p>
        </section>
      </div>
    </div>
  );
}