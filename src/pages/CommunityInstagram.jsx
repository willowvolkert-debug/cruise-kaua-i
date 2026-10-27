import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import BackButton from "@/components/BackButton";
import InstagramFeed from "@/components/community/InstagramFeed";

export default function CommunityInstagram() {
  return (
    <div className="p-4 md:p-8 bg-white min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        <BackButton />

        <div className="space-y-2">
          <h1 className="cruise-head tracking-widest text-4xl text-secondary leading-none">instagram</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See our latest posts from the Cruise Hawaiʻi Instagram feed.
          </p>
        </div>

        <InstagramFeed />
      </div>
    </div>
  );
}