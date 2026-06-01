import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getPublicRides } from "@/functions/getPublicRides";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users, AlertCircle, HelpCircle, Star, CheckCircle, RefreshCw } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, addDays, parseISO } from "date-fns";
import DriverProfileModal from "./DriverProfileModal";
import BookingModal from "../rides/BookingModal";
import FindRideTutorial from "../tutorial/FindRideTutorial";
import { handlePaymentSuccess } from "@/functions/handlePaymentSuccess";

export default function FindRide({ island = "Kauai" }) {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const nextWeekStr = format(addDays(today, 7), 'yyyy-MM-dd');

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextWeekStr);
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

        // Set booking-specific errors for logged-in users
        if (!user.drivers_license_verified && !user.drivers_license_pending_review) {
          setBookingError("🪪 You must submit your driver's license to book a ride. Go to Account → Verification to submit.");
        } else if (user.drivers_license_pending_review && !user.drivers_license_verified) {
          setBookingError("⏳ Your license is currently under review. You'll be able to book once it's approved (usually within 24 hours).");
        } else if (!user.profile_picture_url) {
          setBookingError("Please upload a profile picture before booking rides. Go to Account page.");
        } else if (!user.profile_complete) {
          setBookingError("Please complete your profile before booking rides. Go to Account page.");
        } else if (!user.terms_accepted || !user.privacy_policy_accepted || !user.community_agreement_accepted) {
          setBookingError("Please accept all legal agreements before booking rides. Go to Account page.");
        } else if (user.pending_ratings && user.pending_ratings.length > 0) {
          setBookingError("Please complete your pending trip ratings in the Inbox before booking new rides.");
        }
      } catch (e) {
        // Not logged in — view-only mode
      }

      await loadRides(todayStr, nextWeekStr);
    };
    init();
  }, []);

  const loadRides = async (start = startDate, end = endDate) => {
    setIsLoading(true);
    try {
      const res = await getPublicRides({ start_date: start, end_date: end, island });
      const allRides = res.data?.rides || [];

      // Filter out current user's own rides
      const filtered = allRides.filter(r => !currentUser || r.driver_id !== currentUser.id);
      setRides(filtered);

      const allRatings = await base44.entities.Rating.list().catch(() => []);
      const ratings = {};
      filtered.forEach(ride => {
        ratings[ride.driver_id] = allRatings.filter(r =>
          String(r.rated_user_id) === String(ride.driver_id) && r.trip_role === 'driver'
        );
      });
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

  const ridesByDate = rides.reduce((acc, ride) => {
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
      <Card className="shadow-md border-gray-200 bg-white rounded-2xl">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-end gap-2">
            <div className="space-y-1 flex-1 min-w-0">
              <Label className="text-xs text-gray-500">from</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl text-sm h-9" />
            </div>
            <span className="text-gray-400 mb-2 text-sm">→</span>
            <div className="space-y-1 flex-1 min-w-0">
              <Label className="text-xs text-gray-500">to</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl text-sm h-9" />
            </div>
            <Button onClick={handleRefresh} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-4 h-9 shrink-0">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">{isLoading ? 'loading...' : 'update'}</span>
            </Button>
            <Button onClick={() => setShowTutorial(true)} variant="outline" size="icon" className="rounded-xl border-gray-300 h-9 w-9 shrink-0">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rides List */}
      {isLoading ? (
        <Card className="border-gray-200 rounded-3xl bg-white">
          <CardContent className="p-12 text-center">
            <RefreshCw className="w-10 h-10 text-gray-300 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">loading rides...</p>
          </CardContent>
        </Card>
      ) : Object.keys(ridesByDate).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(ridesByDate)
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
                    {dateRides
                      .sort((a, b) => (a.departure_time || '').localeCompare(b.departure_time || ''))
                      .map((ride) => (
                        <div
                          key={ride.id}
                          className="border border-border rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer bg-white"
                          onClick={() => handleViewDriver(ride)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="font-semibold text-secondary text-sm truncate">
                                {ride.departure_location} → {ride.destination}
                                <span className="font-normal text-gray-500 ml-2">— {ride.departure_time || 'flexible'}</span>
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-base text-primary">
                                ${currentUser?.has_hawaii_id ? (ride.price_per_seat_local || 0) : (ride.price_per_seat_tourist || 0)}
                              </p>
                              <p className="text-xs text-gray-500">/ seat</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
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
                            <div className="flex items-center gap-2">
                              {ride.offers_midpoint_pickup && (
                                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">pickup/dropoff along route</span>
                              )}
                              <div className="flex items-center gap-1 text-gray-500">
                                <Users className="w-3 h-3" />
                                <span className="text-xs">{ride.seats_available}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      ) : (
        <Card className="border-gray-200 rounded-2xl bg-white">
          <CardContent className="p-8 text-center">
            <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-secondary mb-1">no rides posted</h3>
            <p className="text-sm text-gray-500">No rides for this date range. Try expanding the dates or check back later.</p>
          </CardContent>
        </Card>
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