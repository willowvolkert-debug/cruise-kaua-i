import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import InstagramFeed from "@/components/community/InstagramFeed";

export default function CommunityInstagram() {
  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/community" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors">
          <ChevronLeft className="w-4 h-4" /> back to community
        </Link>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-secondary">instagram</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See our latest posts from the Cruise Hawaiʻi Instagram feed.
          </p>
        </div>

        <InstagramFeed />
      </div>
    </div>
  );
}