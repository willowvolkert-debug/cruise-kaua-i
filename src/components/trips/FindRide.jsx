import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, Users, AlertCircle, User as UserIcon, Bell, HelpCircle, Star } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { sendNotification } from "../utils/notifications";
import DriverProfileModal from "./DriverProfileModal";
import BookingModal from "../rides/BookingModal";
import FindRideTutorial from "../tutorial/FindRideTutorial";
import LocationAutocomplete from "../shared/LocationAutocomplete";

export default function FindRide() {
  const [searchData, setSearchData] = useState({
    departure_location: '',
    destination: '',
    departure_date: '',
    departure_time: '',
    seats_required: 1,
    is_flexible: false,
    is_last_minute: false,
    description: ''
  });
  
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [showDriverProfile, setShowDriverProfile] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [driverProfiles, setDriverProfiles] = useState({});
  const [driverRatings, setDriverRatings] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
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



        if (user.pending_ratings && user.pending_ratings.length > 0) {
          setError("Please complete your pending trip ratings in the Inbox before booking new rides.");
          return;
        }
      } catch (e) {
        setError("You must be logged in to use this feature.");
      }
    };
    init();
  }, []);

  const handleInputChange = (field, value) => {
    setSearchData(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = async () => {
    if (!searchData.departure_date) {
      setError("Please enter a departure date.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const allRides = await base44.entities.Ride.list("-created_date");
      let filtered = allRides.filter(ride => ride.status === 'active');

      if (searchData.departure_date) {
        filtered = filtered.filter(ride => ride.departure_date === searchData.departure_date);
      }

      filtered = filtered.filter(ride => ride.seats_available >= searchData.seats_required);

      if (currentUser) {
        filtered = filtered.filter(ride => ride.driver_id !== currentUser.id);
      }

      setRides(filtered);
      setFilteredRides(filtered);
      setHasSearched(true);

      // Load driver profiles and ratings
      const allUsers = await base44.entities.User.list();
      const allRatings = await base44.entities.Rating.list();
      
      const profiles = {};
      const ratings = {};
      
      filtered.forEach(ride => {
        const driver = allUsers.find(u => u.id === ride.driver_id);
        if (driver) profiles[ride.driver_id] = driver;
        
        const driverRatings = allRatings.filter(r => 
          r.rated_user_id === ride.driver_id && r.trip_role === 'driver'
        );
        ratings[ride.driver_id] = driverRatings;
      });
      
      setDriverProfiles(profiles);
      setDriverRatings(ratings);
    } catch (error) {
      console.error("Error searching rides:", error);
      setError("Error searching for rides. Please try again.");
    }
    
    setIsLoading(false);
  };

  const handleGo = async () => {
    if (!searchData.departure_date) {
      setError("Please select a departure date before searching.");
      return;
    }
    
    await handleSearch();
  };

  const handleViewDriver = (ride) => {
    setSelectedRide(ride);
    setShowDriverProfile(true);
  };

  const handleBookRide = (ride) => {
    if (!currentUser) {
      setError("Please log in to book a ride.");
      return;
    }
    
    if (!currentUser.profile_picture_url) {
      setError("Please upload a profile picture before booking rides.");
      return;
    }

    if (!currentUser.profile_complete) {
      setError("Please complete your profile before booking rides.");
      return;
    }

    if (!currentUser.terms_accepted || !currentUser.privacy_policy_accepted || !currentUser.community_agreement_accepted) {
      setError("Please accept all legal agreements before booking rides.");
      return;
    }


    
    if (currentUser.pending_ratings && currentUser.pending_ratings.length > 0) {
      setError("Please complete your pending trip ratings in the Inbox before booking new rides.");
      return;
    }

    setSelectedRide(ride);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async (bookingData) => {
    let initialMessage = bookingData.description;
    
    if (bookingData.wants_detour_service && bookingData.detour_destination) {
      initialMessage = `${bookingData.description}\n\n🚗 DETOUR SERVICE REQUESTED: I would like to be driven to my final destination: ${bookingData.detour_destination}`;
    }

    const finalBookingData = {
      ...bookingData,
      passenger_id: currentUser.id,
      driver_id: selectedRide.driver_id,
      booking_status: 'pending',
      description: initialMessage,
      messages: []
    };
    
    await base44.entities.RideBooking.create(finalBookingData);

    sendNotification(
      'Ride Request Sent!',
      `Your request to join the ride has been sent to the driver.`
    );

    alert("Request sent to driver! You'll be notified when they respond.");
    setShowBookingModal(false);
    handleSearch();
  };

  const ridesByDate = filteredRides.reduce((acc, ride) => {
    const date = ride.departure_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(ride);
    return acc;
  }, {});

  return (
    <div className="space-y-6 relative">
      <Card className="shadow-lg border-gray-200 bg-white rounded-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-secondary">find a ride</CardTitle>
            <Button
              onClick={() => setShowTutorial(true)}
              variant="outline"
              size="sm"
              className="rounded-2xl border-gray-300"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              how to find
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="from">coming from (optional)</Label>
              <LocationAutocomplete
                id="from"
                placeholder="e.g., Lihue"
                value={searchData.departure_location}
                onChange={(value) => handleInputChange('departure_location', value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">going to (optional)</Label>
              <LocationAutocomplete
                id="to"
                placeholder="e.g., Hanalei"
                value={searchData.destination}
                onChange={(value) => handleInputChange('destination', value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date">departure date *</Label>
              <Input
                id="date"
                type="date"
                value={searchData.departure_date}
                onChange={(e) => handleInputChange('departure_date', e.target.value)}
                required
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seats">seats required</Label>
              <Select 
                value={searchData.seats_required.toString()}
                onValueChange={(value) => handleInputChange('seats_required', parseInt(value))}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {Array.from({ length: 4 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1} seat{i > 0 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">description (why?)</Label>
            <Textarea
              id="description"
              placeholder="e.g., Going to visit family, beach trip..."
              value={searchData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="rounded-2xl"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="rounded-2xl border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hasSearched && (
        <div className="space-y-6">
          {Object.keys(ridesByDate).length > 0 ? (
            Object.entries(ridesByDate)
              .sort(([a], [b]) => new Date(a) - new Date(b))
              .map(([date, dateRides]) => (
                <Card key={date} className="shadow-md border-gray-200 bg-white rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-lg text-secondary flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      {format(new Date(date), "EEEE, MMMM d, yyyy")} - All Rides Around Kauaʻi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {dateRides
                        .sort((a, b) => (a.departure_time || '').localeCompare(b.departure_time || ''))
                        .map((ride) => (
                          <div
                            key={ride.id}
                            className="border border-border rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
                            onClick={() => handleViewDriver(ride)}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-semibold text-secondary">{ride.departure_time || 'Flexible time'}</p>
                                <p className="text-sm text-gray-600">{ride.departure_location} → {ride.destination}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-primary">${currentUser?.driver_license_state === 'HI' ? (ride.price_per_seat_local || 0) : (ride.price_per_seat_tourist || 0)}</p>
                                <p className="text-xs text-gray-500">per seat</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 bg-gradient-to-r from-primary to-secondary">
                                  <AvatarImage src={driverProfiles[ride.driver_id]?.profile_picture_url} />
                                  <AvatarFallback className="text-white font-semibold text-sm">
                                    {ride.driver_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className="text-sm font-medium text-gray-700">{ride.driver_name}</span>
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
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{ride.seats_available} seats</span>
                              </div>
                            </div>

                            <p className="text-xs text-gray-500 mt-2 hover:text-primary">
                              Click to view driver profile →
                            </p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : (
            <Card className="border-gray-200 rounded-3xl bg-white">
              <CardContent className="p-12 text-center">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-secondary mb-2">no rides found</h3>
                <p className="text-gray-500">Try selecting a different date or check back later.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleGo}
          disabled={isLoading}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 rounded-full shadow-lg"
        >
          {isLoading ? 'searching...' : 'go'}
        </Button>
      </div>

      <DriverProfileModal
        isOpen={showDriverProfile}
        onClose={() => setShowDriverProfile(false)}
        ride={selectedRide}
        onBookRide={handleBookRide}
        currentUser={currentUser}
      />

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        ride={selectedRide}
        onConfirmBooking={handleConfirmBooking}
      />

      <FindRideTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </div>
  );
}