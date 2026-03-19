import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
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

export default function FindRide() {
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
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [driverRatings, setDriverRatings] = useState({});
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        const urlParams = new URLSearchParams(window.location.search);
        const bookingId = urlParams.get('booking_id');
        const paymentStatus = urlParams.get('payment');

        if (bookingId && paymentStatus === 'success') {
          const sessionId = urlParams.get('session_id');
          try {
            await handlePaymentSuccess({ booking_id: bookingId, session_id: sessionId });
            setPaymentSuccess(true);
            window.history.replaceState({}, '', window.location.pathname);
          } catch (err) {
            console.error("Error handling payment success:", err);
          }
        } else if (bookingId && paymentStatus === 'cancelled') {
          try {
            await base44.entities.RideBooking.delete(bookingId);
          } catch (err) {
            console.error("Error deleting cancelled booking:", err);
          }
          window.history.replaceState({}, '', window.location.pathname);
        }

        if (!user.profile_picture_url) {
          setError("Please upload a profile picture before booking rides. Go to Account page.");
          return;
        }
        if (!user.profile_complete) {
          setError("Please complete your profile (username, bio, age, gender) before booking rides. Go to Account page.");
          return;
        }
        if (!user.terms_accepted || !user.privacy_policy_accepted || !user.community_agreement_accepted) {
          setError("Please accept all legal agreements before booking rides. Go to Account page.");
          return;
        }
        if (!user.drivers_license_verified) {
          setError("Please verify your driver's license before booking rides. Go to Account page.");
          return;
        }
        if (!user.notifications_enabled) {
          setError("Please enable notifications before booking rides. Go to Account page and tap 'enable now' under notifications.");
          return;
        }
        if (user.user_type !== 'rider' && user.user_type !== 'driver' && user.role !== 'admin') {
          setError("Your account must be upgraded to rider status before booking rides. Please complete your profile and license verification.");
          return;
        }
        if (user.pending_ratings && user.pending_ratings.length > 0) {
          setError("Please complete your pending trip ratings in the Inbox before booking new rides.");
          return;
        }

        // Auto-load rides after user checks pass
        await loadRides(user);
      } catch (e) {
        setError("You must be logged in to use this feature.");
      }
    };
    init();
  }, []);

  const loadRides = async (user, start = startDate, end = endDate) => {
    setIsLoading(true);
    try {
      const allRides = await base44.entities.Ride.list("-departure_date");
      const filtered = allRides.filter(ride => {
        if (ride.status !== 'active') return false;
        if (ride.departure_date < start || ride.departure_date > end) return false;
        if (user && ride.driver_id === user.id) return false;
        return true;
      });

      setRides(filtered);

      const allRatings = await base44.entities.Rating.list();
      const ratings = {};
      filtered.forEach(ride => {
        const dRatings = allRatings.filter(r =>
          String(r.rated_user_id) === String(ride.driver_id) && r.trip_role === 'driver'
        );
        ratings[ride.driver_id] = dRatings;
      });
      setDriverRatings(ratings);
    } catch (err) {
      console.error("Error loading rides:", err);
      setError("Error loading rides. Please try again.");
    }
    setIsLoading(false);
  };

  const handleDateChange = (newStart, newEnd) => {
    if (newStart) setStartDate(newStart);
    if (newEnd) setEndDate(newEnd);
  };

  const handleRefresh = () => {
    if (currentUser) loadRides(currentUser, startDate, endDate);
  };

  const handleViewDriver = (ride) => {
    setSelectedRide(ride);
    setShowDriverProfile(true);
  };

  const handleCloseDriverProfile = () => {
    setShowDriverProfile(false);
  };

  const handleBookRide = (ride) => {
    setSelectedRide(ride);
    setShowDriverProfile(false);
    setShowBookingModal(true);
  };

  const ridesByDate = rides.reduce((acc, ride) => {
    const date = ride.departure_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(ride);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {paymentSuccess && (
        <Alert className="rounded-2xl border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Payment successful! Your ride request has been sent to the driver. They will be notified by email.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="rounded-2xl border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Date Range Filter */}
      <Card className="shadow-md border-gray-200 bg-white rounded-2xl">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-end gap-2">
            <div className="space-y-1 flex-1 min-w-0">
              <Label className="text-xs text-gray-500">from</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange(e.target.value, null)}
                className="rounded-xl text-sm h-9"
              />
            </div>
            <span className="text-gray-400 mb-2 text-sm">→</span>
            <div className="space-y-1 flex-1 min-w-0">
              <Label className="text-xs text-gray-500">to</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange(null, e.target.value)}
                className="rounded-xl text-sm h-9"
              />
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl px-4 h-9 mb-0 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">{isLoading ? 'loading...' : 'update'}</span>
            </Button>
            <Button
              onClick={() => setShowTutorial(true)}
              variant="outline"
              size="icon"
              className="rounded-xl border-gray-300 h-9 w-9 shrink-0"
            >
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
                    {format(parseISO(date), "EEE, MMM d")}
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
                              <p className="font-semibold text-secondary text-sm">{ride.departure_time || 'Flexible'}</p>
                              <p className="text-xs text-gray-600 truncate">{ride.departure_location} → {ride.destination}</p>
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
                                <span className="text-xs font-medium text-gray-700">
                                  @{ride.driver_username || ride.driver_name}
                                </span>
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
        </div>
      ) : (
        <Card className="border-gray-200 rounded-3xl bg-white">
          <CardContent className="p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-secondary mb-2">no rides posted</h3>
            <p className="text-gray-500">No rides have been posted for this date range. Try expanding the dates or check back later.</p>
          </CardContent>
        </Card>
      )}

      <DriverProfileModal
        isOpen={showDriverProfile}
        onClose={handleCloseDriverProfile}
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

      <FindRideTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </div>
  );
}