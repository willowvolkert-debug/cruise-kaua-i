import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TripsPage from "./Trips";
import CommunityPage from "./Community";

export default function Home() {
  return (
    <div className="bg-white min-h-screen">
      <Tabs defaultValue="trips" className="w-full">
        <div className="p-3 border-b border-gray-100 bg-white">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="trips" className="text-base">🚗 trips</TabsTrigger>
            <TabsTrigger value="community" className="text-base">🌺 community</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="trips" className="mt-0 focus-visible:outline-none">
          <TripsPage />
        </TabsContent>
        <TabsContent value="community" className="mt-0 focus-visible:outline-none">
          <CommunityPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}