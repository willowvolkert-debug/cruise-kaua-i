import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getPublicRides } from "@/functions/getPublicRides";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users, AlertCircle, HelpCircle, Star, CheckCircle, RefreshCw, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, addDays, parseISO } from "date-fns";
import DatePickerButton from "@/components/shared/DatePickerButton";
import DriverProfileModal from "./DriverProfileModal";
import BookingModal from "../rides/BookingModal";
import FindRideTutorial from "../tutorial/FindRideTutorial";
import { handlePaymentSuccess } from "@/functions/handlePaymentSuccess";

export default function FindRide({ island = "Kauai", initialStartDate, initialEndDate, hideDateFilter = false }) {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const nextWeekStr = format(addDays(today, 7), 'yyyy-MM-dd');

  const [startDate, setStartDate] = useState(initialStartDate || todayStr);
  const [endDate, setEndDate] = useState(initialEndDate || nextWeekStr);
  const [rides, setRides] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [showDriverProfile, setShowDriverProfile] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [driverRatings, setDriverRatings] = useState({});
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const init = async () => {
      // Try to load current user (optional)
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        const urlParams = new URLSearchParams(window.location.search);
        const bookingId = urlParams.get('booking_id');
        const paymentStatus = urlParams.get('payment');

        if (bookingId && paymentStatus === 'success') {
          try {
            await handlePaymentSuccess({ booking_id: bookingId, session_id: urlParams.get('session_id') });
            setPaymentSuccess(true);
            window.history.replaceState({}, '', window.location.pathname);
          } catch (err) {
            console.error("Error handling payment success:", err);
          }
        } else if (bookingId && paymentStatus === 'cancelled') {
          try { await base44.entities.RideBooking.delete(bookingId); } catch (e) {}
          window.history.replaceState({}, '', window.location.pathname);
        }

      } catch (e) {
        // Not logged in — view-only mode
      }

      await loadRides(initialStartDate || todayStr, initialEndDate || nextWeekStr);
    };
    init();
  }, []);

  const loadRides = async (start = startDate, end = endDate) => {
    setIsLoading(true);
    try {
      const res = await getPublicRides({ start_date: start, end_date: end, island });
      const allRides = res.data?.rides || [];

      // Filter out current user's own rides (unless they're admin)
      const filtered = allRides.filter(r => !currentUser || currentUser.role === 'admin' || r.driver_id !== currentUser.id);
      setRides(filtered);

      // Fetch ratings only for the drivers in the current ride list,
      // not every rating in the database.
      const driverIds = [...new Set(filtered.map(r => r.driver_id).filter(Boolean))];
      const ratings = {};
      if (currentUser && driverIds.length > 0) {
        const rideRatings = await base44.entities.Rating.filter({
          rated_user_id: { $in: driverIds },
          trip_role: 'driver'
        }).catch(() => []);
        driverIds.forEach(did => {
          ratings[did] = (rideRatings || []).filter(r => String(r.rated_user_id) === String(did));
        });
      }
      setDriverRatings(ratings);
    } catch (err) {
      console.error("Error loading rides:", err);
    }
    setIsLoading(false);
  };

  const handleRefresh = () => loadRides(startDate, endDate);

  const handleViewDriver = (ride) => {
    setSelectedRide(ride);
    setShowDriverProfile(true);
  };

  const handleBookRide = (ride) => {
    setSelectedRide(ride);
    setShowDriverProfile(false);
    setShowBookingModal(true);
  };

  // Filter rides by search query — matches departure, destination, or stops.
  // Uses simple includes() so "Lihue" matches "Lihue Airport", "Watumull Plaza, Lihue", etc.
  const filteredRides = searchQuery.trim()
    ? rides.filter(r => {
        const q = searchQuery.toLowerCase().trim();
        const dep = (r.departure_location || '').toLowerCase();
        const dest = (r.destination || '').toLowerCase();
        const stops = (r.stops || []).join(' ').toLowerCase();
        return dep.includes(q) || dest.includes(q) || stops.includes(q) ||
               q.includes(dep) || q.includes(dest);
      })
    : rides;

  const ridesByDate = filteredRides.reduce((acc, ride) => {
    if (!acc[ride.departure_date]) acc[ride.departure_date] = [];
    acc[ride.departure_date].push(ride);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {paymentSuccess && (
        <Alert className="rounded-2xl border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Payment successful! Your ride request has been sent to the driver.
          </AlertDescription>
        </Alert>
      )}

      {bookingError && (
        <Alert variant="destructive" className="rounded-2xl border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{bookingError}</AlertDescription>
        </Alert>
      )}

      {!currentUser && (
        <Alert className="rounded-2xl border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            <button onClick={() => base44.auth.redirectToLogin()} className="underline font-semibold">Sign up or log in</button> to book a ride.
          </AlertDescription>
        </Alert>
      )}

      {/* Date Range Filter */}
      {!hideDateFilter && (
        <div className="rounded-3xl border-2 border-gray-200 bg-gray-50 p-5 space-y-4">
          <p className="text-base font-bold text-gray-700">📅 pick your dates</p>
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="space-y-1.5 flex-1">
              <Label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">from</Label>
              <DatePickerButton value={startDate} onChange={setStartDate} placeholder="start date" />
            </div>
            <div className="hidden sm:flex items-end pb-3 text-gray-400 text-xl font-light">→</div>
            <div className="space-y-1.5 flex-1">
              <Label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">to</Label>
              <DatePickerButton value={endDate} onChange={setEndDate} placeholder="end date" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 text-base font-bold"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'loading...' : 'find rides 🔍'}
            </Button>
            <Button
              onClick={() => setShowTutorial(true)}
              variant="outline"
              className="rounded-2xl h-12 px-4 border-2 border-gray-200"
            >
              <HelpCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Location Search */}
      {rides.length > 0 && (
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
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Rides List */}
      {isLoading ? (
        <div className="rounded-3xl border-2 border-gray-200 bg-gray-50 p-12 text-center">
          <RefreshCw className="w-10 h-10 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-base font-semibold text-gray-500">loading rides...</p>
        </div>
      ) : Object.keys(ridesByDate).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(ridesByDate)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .map(([date, dateRides]) => (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-3 px-1">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-2xl shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-secondary leading-tight">
                      {format(parseISO(date), "EEEE")}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">
                      {format(parseISO(date), "MMMM do, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {dateRides
                    .sort((a, b) => {
                      const toMinutes = (t) => {
                        if (!t) return 9999;
                        const withColon = t.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                        const noColon = t.match(/^(\d{1,4})\s*(AM|PM)?$/i);
                        let h, m, period;
                        if (withColon) {
                          h = parseInt(withColon[1]);
                          m = parseInt(withColon[2]);
                          period = (withColon[3] || '').toUpperCase();
                        } else if (noColon) {
                          const num = noColon[1];
                          period = (noColon[2] || '').toUpperCase();
                          if (num.length <= 2) { h = parseInt(num); m = 0; }
                          else { h = parseInt(num.slice(0, num.length - 2)); m = parseInt(num.slice(-2)); }
                        } else return 9999;
                        if (period === 'PM' && h !== 12) h += 12;
                        if (period === 'AM' && h === 12) h = 0;
                        return h * 60 + m;
                      };
                      return toMinutes(a.departure_time) - toMinutes(b.departure_time);
                    })
                    .map((ride) => (
                      <button
                        key={ride.id}
                        className="w-full text-left border-2 border-gray-200 rounded-3xl p-5 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-all bg-white group"
                        onClick={() => handleViewDriver(ride)}
                      >
                        {/* Route + time */}
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <p className="font-bold text-secondary text-base leading-snug group-hover:text-primary transition-colors">
                            {ride.departure_location} → {ride.destination}
                          </p>
                          <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full shrink-0">
                            {ride.departure_time || 'flexible'}
                          </span>
                        </div>

                        {/* Driver row */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 shrink-0">
                              <AvatarImage src={ride.driver_profile_picture_url} alt={ride.driver_name} />
                              <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm">
                                {ride.driver_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'DR'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-bold text-gray-800">@{ride.driver_username || ride.driver_name}</p>
                              {driverRatings[ride.driver_id]?.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                  <span className="text-sm font-semibold text-gray-600">
                                    {(driverRatings[ride.driver_id].reduce((sum, r) => sum + r.rating_value, 0) / driverRatings[ride.driver_id].length).toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            {ride.offers_midpoint_pickup && (
                              <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">🚗 pickup/dropoff available along route</span>
                            )}
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Users className="w-4 h-4" />
                              <span className="text-sm font-semibold">{ride.seats_available} seats</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-gray-400 italic mt-3 text-right">tap to see price & details →</p>
                      </button>
                    ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-gray-200 bg-gray-50 p-10 text-center">
          <p className="text-4xl mb-3">🚗</p>
          <h3 className="text-lg font-bold text-secondary mb-2">no rides posted yet</h3>
          <p className="text-gray-500">No rides for this date range — try adjusting the dates or check back later.</p>
        </div>
      )}

      <DriverProfileModal
        isOpen={showDriverProfile}
        onClose={() => setShowDriverProfile(false)}
        ride={selectedRide}
        onBookRide={handleBookRide}
        currentUser={currentUser}
        driverRatings={selectedRide ? driverRatings[selectedRide.driver_id] : []}
      />

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        ride={selectedRide}
      />

      <FindRideTutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
}