import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { getPublicRides } from "@/functions/getPublicRides";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Users, Star, Search, Calendar } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
import DriverProfileModal from "./DriverProfileModal";
import BookingModal from "../rides/BookingModal";

function normalize(str) {
  return (str || "").toLowerCase().trim();
}

function matchesLocation(rideLocation, query) {
  if (!query) return false;
  const q = normalize(query);
  return normalize(rideLocation).includes(q);
}

function rideMatchesRoute(ride, from, to) {
  const fromQ = normalize(from);
  const toQ = normalize(to);

  const allLocations = [
    ride.departure_location,
    ride.destination,
    ...(ride.stops || []),
  ];

  const fromMatch = allLocations.some(loc => normalize(loc).includes(fromQ));
  const toMatch = allLocations.some(loc => normalize(loc).includes(toQ));

  // Direct route match: both from and to appear in the ride's locations/stops
  if (fromMatch && toMatch) return true;

  // Midpoint pickup: driver offers pickup/dropoff along the way, so match if
  // either the "from" or "to" location appears anywhere in the ride's route.
  // e.g. a Lihue→Hanalei driver with midpoint pickup matches a "Lihue→Kilauea" search.
  if (ride.offers_midpoint_pickup && (fromMatch || toMatch)) return true;

  return false;
}

export default function RouteSearch({ island }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [driverRatings, setDriverRatings] = useState({});
  const [selectedRide, setSelectedRide] = useState(null);
  const [showDriverProfile, setShowDriverProfile] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const handleSearch = async () => {
    if (!from.trim() || !to.trim()) return;
    setIsLoading(true);
    setResults(null);

    const startDate = date || format(new Date(), 'yyyy-MM-dd');
    const endDate = date || format(addDays(new Date(), 60), 'yyyy-MM-dd');

    const res = await getPublicRides({ start_date: startDate, end_date: endDate, island });
    const allRides = res.data?.rides || [];

    const filtered = allRides.filter(r => {
      if (currentUser && currentUser.role !== 'admin' && r.driver_id === currentUser.id) return false;
      return rideMatchesRoute(r, from, to);
    });

    const allRatings = currentUser ? await base44.entities.Rating.list().catch(() => []) : [];
    const ratings = {};
    filtered.forEach(ride => {
      ratings[ride.driver_id] = allRatings.filter(r =>
        String(r.rated_user_id) === String(ride.driver_id) && r.trip_role === 'driver'
      );
    });
    setDriverRatings(ratings);
    setResults(filtered);
    setIsLoading(false);
  };

  const grouped = results ? results.reduce((acc, ride) => {
    if (!acc[ride.departure_date]) acc[ride.departure_date] = [];
    acc[ride.departure_date].push(ride);
    return acc;
  }, {}) : {};

  return (
    <div className="space-y-5">
      <div className="space-y-4 p-5 rounded-3xl border-2 border-gray-200 bg-gray-50">
        <div className="space-y-1">
          <Label className="text-sm font-semibold text-gray-700">coming from</Label>
          <Input
            placeholder="e.g. Lihue, Waimea, Poipu..."
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="rounded-2xl h-11"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-semibold text-gray-700">going to</Label>
          <Input
            placeholder="e.g. Princeville, Hanalei..."
            value={to}
            onChange={e => setTo(e.target.value)}
            className="rounded-2xl h-11"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-semibold text-gray-700">date <span className="font-normal text-gray-400">(optional)</span></Label>
          <p className="text-xs text-gray-400 -mt-0.5">Leave empty if your schedule is flexible</p>
          <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="rounded-2xl h-11"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isLoading || !from.trim() || !to.trim()}
          className="w-full bg-primary hover:bg-primary/90 rounded-2xl h-12 font-semibold text-base"
        >
          <Search className="w-4 h-4 mr-2" />
          {isLoading ? "searching..." : "search rides"}
        </Button>
      </div>

      {results !== null && (
        <div className="space-y-4">
          {Object.keys(grouped).length === 0 ? (
            <Card className="rounded-2xl border-gray-200">
              <CardContent className="p-8 text-center">
                <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-secondary mb-1">no matching rides found</h3>
                <p className="text-sm text-gray-500">
                  No rides pass through {from} → {to}{date ? ` on ${format(parseISO(date), 'MMM d')}` : ""}. Try different locations or leave the date blank.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-gray-500 font-medium">{results.length} ride{results.length !== 1 ? 's' : ''} found passing through your route</p>
              {Object.entries(grouped)
                .sort(([a], [b]) => new Date(a) - new Date(b))
                .map(([date, dateRides]) => (
                  <Card key={date} className="shadow-sm border-gray-200 bg-white rounded-2xl">
                    <CardHeader className="pb-2 px-4 pt-4">
                      <CardTitle className="text-sm font-semibold text-secondary flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        {format(parseISO(date), "MM/dd/yyyy")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="flex flex-col gap-2">
                        {dateRides.map(ride => (
                          <div
                            key={ride.id}
                            className="border border-border rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer bg-white"
                            onClick={() => { setSelectedRide(ride); setShowDriverProfile(true); }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="min-w-0 flex-1 pr-2">
                                <p className="font-semibold text-secondary text-sm truncate">
                                  {ride.departure_location} → {ride.destination}
                                  <span className="font-normal text-gray-500 ml-2">— {ride.departure_time || 'flexible'}</span>
                                </p>
                                {ride.offers_midpoint_pickup && (
                                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1 inline-block">pickup/dropoff along route</span>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-base text-primary">
                                  ${currentUser?.has_hawaii_id ? (ride.price_per_seat_local || 0) : (ride.price_per_seat_tourist || 0)}
                                </p>
                                <p className="text-xs text-gray-500">/ seat</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8 shrink-0">
                                  <AvatarImage src={ride.driver_profile_picture_url} alt={ride.driver_name} />
                                  <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white font-semibold text-xs">
                                    {ride.driver_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'DR'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className="text-xs font-medium text-gray-700">@{ride.driver_username || ride.driver_name}</span>
                                  {driverRatings[ride.driver_id]?.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                      <span className="text-xs text-gray-600">
                                        {(driverRatings[ride.driver_id].reduce((sum, r) => sum + r.rating_value, 0) / driverRatings[ride.driver_id].length).toFixed(1)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-gray-500">
                                <Users className="w-3 h-3" />
                                <span className="text-xs">{ride.seats_available}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </>
          )}
        </div>
      )}

      <DriverProfileModal
        isOpen={showDriverProfile}
        onClose={() => setShowDriverProfile(false)}
        ride={selectedRide}
        onBookRide={(ride) => { setSelectedRide(ride); setShowDriverProfile(false); setShowBookingModal(true); }}
        currentUser={currentUser}
        driverRatings={selectedRide ? driverRatings[selectedRide.driver_id] : []}
      />
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        ride={selectedRide}
      />
    </div>
  );
}