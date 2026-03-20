import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MessageSquarePlus, Car, MapPin, EyeOff, Eye } from "lucide-react";
import FindRide from "../components/trips/FindRide";
import RequestRide from "../components/trips/RequestRide";
import PostRideForm from "../components/trips/PostRideForm";
import { base44 } from "@/api/base44Client";

const ISLANDS = ["Kauai", "Oahu", "Maui", "Big Island"];

export default function TripsPage() {
  const [isExploreMode, setIsExploreMode] = React.useState(false);
  const [selectedIsland, setSelectedIsland] = React.useState("Kauai");
  const [islandLoaded, setIslandLoaded] = React.useState(false);
  const [islandSelectorVisible, setIslandSelectorVisible] = React.useState(true);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const exploreParam = urlParams.get('explore');
    setIsExploreMode(exploreParam === 'true');

    // Load saved island preference from user profile
    base44.auth.me().then(user => {
      if (user?.preferred_island) {
        setSelectedIsland(user.preferred_island);
      }
      setIslandLoaded(true);
    }).catch(() => setIslandLoaded(true));
  }, []);

  const handleIslandChange = async (island) => {
    setSelectedIsland(island);
    window.dispatchEvent(new CustomEvent('islandChanged', { detail: island }));
    try {
      await base44.auth.updateMe({ preferred_island: island });
    } catch (e) {
      // non-critical
    }
  };

  React.useEffect(() => {
    if (islandLoaded) {
      window.dispatchEvent(new CustomEvent('islandChanged', { detail: selectedIsland }));
    }
  }, [islandLoaded, selectedIsland]);

  return (
    <div className="p-3 md:p-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-2">
            plan your trip
          </h1>
          <p className="text-gray-600">find a ride, request a ride, or offer seats for your next drive</p>

          {/* Island Selector */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium">island:</span>
              <button
                onClick={() => setIslandSelectorVisible(v => !v)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline"
              >
                {islandSelectorVisible ? "hide" : "show"}
              </button>
            </div>
            {islandSelectorVisible && (
              <div className="flex flex-wrap gap-2">
                {ISLANDS.map(island => (
                  <button
                    key={island}
                    onClick={() => handleIslandChange(island)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedIsland === island
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {island}
                  </button>
                ))}
              </div>
            )}
            {!islandSelectorVisible && (
              <span className="text-sm font-medium text-primary">{selectedIsland}</span>
            )}
          </div>

          {isExploreMode && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <p className="text-blue-800 text-sm">
                You're in explore mode. <button onClick={() => window.location.href = '/'} className="underline font-semibold">Sign up</button> to post rides and book trips!
              </p>
            </div>
          )}
        </div>

        <Tabs defaultValue="find" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-3xl">
            <TabsTrigger value="find" className="py-2.5 text-base flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md rounded-3xl">
              <Search className="w-5 h-5"/> view all rides
            </TabsTrigger>
            <TabsTrigger value="request" className="py-2.5 text-base flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md rounded-3xl">
              <MessageSquarePlus className="w-5 h-5"/> request a ride
            </TabsTrigger>
            <TabsTrigger value="post" className="py-2.5 text-base flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md rounded-3xl">
              <Car className="w-5 h-5"/> post a ride
            </TabsTrigger>
          </TabsList>
          <TabsContent value="find" className="mt-6">
            <FindRide island={selectedIsland} />
          </TabsContent>
          <TabsContent value="request" className="mt-6">
            <RequestRide island={selectedIsland} />
          </TabsContent>
          <TabsContent value="post" className="mt-6">
            <PostRideForm island={selectedIsland} />
          </TabsContent>
        </Tabs>

        <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Cruise Hawaiʻi. Specializing in carpooling and ridesharing across Hawaiʻi.
        </footer>
      </div>
    </div>
  );
}