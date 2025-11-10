import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Search } from "lucide-react";
import FindRide from "../components/trips/FindRide";
import PostRideForm from "../components/trips/PostRideForm";

export default function TripsPage() {
  return (
    <div className="p-4 md:p-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-2">
            plan your trip
          </h1>
          <p className="text-gray-600">find a ride or offer seats for your next drive</p>
        </div>

        <Tabs defaultValue="find" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-3xl">
            <TabsTrigger value="find" className="py-2.5 text-base flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md rounded-3xl">
              <Search className="w-5 h-5"/> find a ride
            </TabsTrigger>
            <TabsTrigger value="post" className="py-2.5 text-base flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md rounded-3xl">
              <Car className="w-5 h-5"/> post a ride
            </TabsTrigger>
          </TabsList>
          <TabsContent value="find" className="mt-6">
            <FindRide />
          </TabsContent>
          <TabsContent value="post" className="mt-6">
            <PostRideForm />
          </TabsContent>
        </Tabs>

        <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Cruise Kauaʻi. All rights reserved.
        </footer>
      </div>
    </div>
  );
}