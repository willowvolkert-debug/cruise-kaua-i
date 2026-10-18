import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { locationsMatch } from "@/lib/locationMatching";
import RideRequestCard from "./RideRequestCard";
import MessageRiderModal from "./MessageRiderModal";
import RiderProfileModal from "./RiderProfileModal";
import { toast } from "@/components/ui/use-toast";

export default function BrowseRideRequests({ island = "Kauai", onRespondWithRide }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageRequest, setMessageRequest] = useState(null);
  const [profileRequest, setProfileRequest] = useState(null);
  const [riderRatings, setRiderRatings] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {
        // Not logged in — show nothing
      }
      await loadRequests();
    };
    init();
  }, [island]);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const allRequests = await base44.entities.RidePost.filter({
        status: "active",
        island,
      });

      // Filter out past requests
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const futureRequests = allRequests.filter((r) => {
        if (!r.departure_date) return false;
        const dateStr = r.departure_date.includes("T")
          ? r.departure_date.split("T")[0]
          : r.departure_date;
        return dateStr >= todayStr;
      });

      // Filter out current user's own requests
      const visible = currentUser
        ? futureRequests.filter((r) => r.rider_id !== currentUser.id)
        : futureRequests;

      setRequests(visible);

      // Fetch rider ratings
      const riderIds = [...new Set(visible.map((r) => r.rider_id).filter(Boolean))];
      const ratings = {};
      if (riderIds.length > 0) {
        const allRatings = await base44.entities.Rating.filter({
          rated_user_id: { $in: riderIds },
          trip_role: "rider",
        }).catch(() => []);
        riderIds.forEach((rid) => {
          ratings[rid] = (allRatings || []).filter(
            (r) => String(r.rated_user_id) === String(rid)
          );
        });
      }
      setRiderRatings(ratings);
    } catch (err) {
      console.error("Error loading ride requests:", err);
    }
    setIsLoading(false);
  };

  const handleMessageSent = (request) => {
    toast({
      title: "message sent ✓",
      description: `${request.rider_name} will be notified. Continue chatting in your inbox.`,
      duration: 5000,
    });
  };

  const handleRespondWithRide = (request) => {
    if (onRespondWithRide) {
      onRespondWithRide(request);
    }
  };

  // Filter by search query using zone-based matching
  const filteredRequests = searchQuery.trim()
    ? requests.filter((r) => {
        const q = searchQuery.trim();
        return (
          locationsMatch(r.departure_location || "", q) ||
          locationsMatch(r.destination || "", q) ||
          (r.stops || []).some((s) => locationsMatch(s, q))
        );
      })
    : requests;

  // Sort by departure date, then time
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const dateA = a.departure_date?.includes("T")
      ? a.departure_date.split("T")[0]
      : a.departure_date || "";
    const dateB = b.departure_date?.includes("T")
      ? b.departure_date.split("T")[0]
      : b.departure_date || "";
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return (a.departure_time || "").localeCompare(b.departure_time || "");
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary">ride requests</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            riders looking for a ride — message them or post a matching ride
          </p>
        </div>
        <Button
          onClick={loadRequests}
          variant="outline"
          size="sm"
          className="rounded-2xl shrink-0"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          refresh
        </Button>
      </div>

      {/* Search */}
      {requests.length > 0 && (
        <div className="relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="search by location — e.g., 'Lihue', 'Hanalei', 'airport'..."
            className="rounded-2xl h-12 pl-10 border-2 border-gray-200 focus:border-primary"
          />
          <MapPin className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="rounded-3xl border-2 border-gray-200 bg-gray-50 p-12 text-center">
          <RefreshCw className="w-10 h-10 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-base font-semibold text-gray-500">loading requests...</p>
        </div>
      ) : sortedRequests.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 font-medium">
            {sortedRequests.length} open request{sortedRequests.length !== 1 ? "s" : ""}
          </p>
          {sortedRequests.map((request) => (
            <RideRequestCard
              key={request.id}
              request={request}
              onMessage={(req) => setMessageRequest(req)}
              onViewProfile={(req) => setProfileRequest(req)}
              onRespondWithRide={handleRespondWithRide}
            />
          ))}
        </div>
      ) : (
        <Card className="rounded-3xl border-2 border-gray-200 bg-gray-50">
          <CardContent className="p-10 text-center space-y-3">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-secondary">no open ride requests right now</h3>
            <p className="text-gray-500">
              When riders post requests for rides on {island}, they'll appear here.
              Check back later or post a ride to let riders find you.
            </p>
          </CardContent>
        </Card>
      )}

      <MessageRiderModal
        isOpen={!!messageRequest}
        onClose={() => setMessageRequest(null)}
        request={messageRequest}
        onMessageSent={handleMessageSent}
      />

      <RiderProfileModal
        isOpen={!!profileRequest}
        onClose={() => setProfileRequest(null)}
        request={profileRequest}
        riderRatings={profileRequest ? riderRatings[profileRequest.rider_id] || [] : []}
      />
    </div>
  );
}