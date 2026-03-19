import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MessageSquarePlus, Car } from "lucide-react";
import FindRide from "../components/trips/FindRide";
import RequestRide from "../components/trips/RequestRide";
import PostRideForm from "../components/trips/PostRideForm";

export default function TripsPage() {
  const [isExploreMode, setIsExploreMode] = React.useState(false);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const exploreParam = urlParams.get('explore');
    setIsExploreMode(exploreParam === 'true');
  }, []);

  return (
    <div className="p-3 md:p-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-2">
            plan your trip
          </h1>
          <p className="text-gray-600">find a ride, request a ride, or offer seats for your next drive</p>
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
            <FindRide />
          </TabsContent>
          <TabsContent value="request" className="mt-6">
            <RequestRide />
          </TabsContent>
          <TabsContent value="post" className="mt-6">
            <PostRideForm />
          </TabsContent>
        </Tabs>

        <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Cruise Hawaiʻi. Specializing in carpooling and ridesharing across Hawaiʻi.
        </footer>
      </div>
    </div>
  );
}