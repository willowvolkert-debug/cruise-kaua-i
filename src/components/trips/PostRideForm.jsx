import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, DollarSign, Car, X, Plus, AlertCircle, Clock, Users, HelpCircle, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PostRideTutorial from "../tutorial/PostRideTutorial";
import LocationAutocomplete from "../shared/LocationAutocomplete";
import RideRequestCard from "./RideRequestCard";
import MessageRiderModal from "./MessageRiderModal";

export default function PostRideForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [stops, setStops] = useState(['']);
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasUnsupportedLocation, setHasUnsupportedLocation] = useState(false);
  const [rideRequests, setRideRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [matchedRequest, setMatchedRequest] = useState(null);
  const [showRideRequests, setShowRideRequests] = useState(true);
  const [rideData, setRideData] = useState({
    departure_location: '',
    destination: '',
    departure_date: '',
    departure_time: '',
    is_flexible: false,
    is_last_minute: false,
    seats_available: 1,
    price_per_seat: 0,
    price_per_seat_local: 0,
    price_per_seat_tourist: 0,
    rider_preference: 'both_fine',
    description: '',
    car_model: '',
    offers_detour_service: false
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        // Fetch active ride requests
        const requests = await base44.entities.RideRequest.filter({ status: 'active' });
        setRideRequests(requests);
        
        if (!user.profile_picture_url) {
          setError("Please upload a profile picture before posting rides. Go to Account page.");
          return;
        }

        if (!user.profile_complete) {
          setError("Please complete your profile (username, bio, age, gender) before posting rides. Go to Account page.");
          return;
        }

        if (!user.terms_accepted || !user.privacy_policy_accepted || !user.community_agreement_accepted) {
          setError("Please accept all legal agreements before posting rides. Go to Account page.");
          return;
        }

        if (user.pending_ratings && user.pending_ratings.length > 0) {
          setError("Please complete your pending trip ratings in the Inbox before posting new rides.");
          return;
        }

        if (!user.drivers_license_verified) {
          setError("You must verify your driver's license before posting rides. Please complete verification in your Account page.");
          return;
        }

        if (!user.vehicle_verified) {
          setError("You must verify your vehicle before posting rides. Please complete vehicle details in your Account page.");
          return;
        }

        if (!user.stripe_connect_onboarding_complete) {
          setError("You must complete Stripe Connect onboarding before posting rides. Please complete this in your Account page.");
          return;
        }

        if (user.user_type !== 'driver' && user.role !== 'admin') {
          setError("You must be verified as a driver to post rides. Please complete all driver requirements in your Account page.");
          return;
        }

        if (user.vehicle_make && user.vehicle_model) {
          setRideData(prev => ({
            ...prev,
            car_model: `${user.vehicle_make} ${user.vehicle_model} ${user.vehicle_year || ''}`.trim()
          }));
        }
      } catch (e) {
        setError("You must be logged in to post a ride.");
      }
    };
    fetchUser();
  }, []);

  const handleInputChange = (field, value) => {
    setRideData(prev => ({ ...prev, [field]: value }));
  };

  const handleStopChange = (index, value) => {
    const newStops = [...stops];
    newStops[index] = value;
    setStops(newStops);
  };
  
  const addStop = () => setStops([...stops, '']);
  const removeStop = (index) => setStops(stops.filter((_, i) => i !== index));

  const handleMessageRequest = (request) => {
    setSelectedRequest(request);
    setShowMessageModal(true);
  };

  const handleMessageSent = (request) => {
    setMatchedRequest(request);
    // Pre-fill route details
    setRideData(prev => ({
      ...prev,
      departure_location: request.departure_location,
      destination: request.destination,
      departure_date: request.departure_date,
      departure_time: request.departure_time,
      is_flexible: request.is_flexible
    }));
    if (request.stops && request.stops.length > 0) {
      setStops(request.stops);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!currentUser) {
      setError("You must be logged in to post a ride.");
      return;
    }

    if (!currentUser.profile_picture_url) {
      setError("Please upload a profile picture before posting rides.");
      return;
    }

    if (!currentUser.profile_complete) {
      setError("Please complete your profile before posting rides.");
      return;
    }

    if (!currentUser.terms_accepted || !currentUser.privacy_policy_accepted || !currentUser.community_agreement_accepted) {
      setError("Please accept all legal agreements before posting rides.");
      return;
    }

    if (!rideData.departure_location || !rideData.destination || !rideData.departure_date || !rideData.departure_time.replace(/\s*(AM|PM)$/i, '').trim()) {
      setError("Please fill in all required fields: coming from, going to, departure date, and departure time.");
      return;
    }
    
    if (currentUser.pending_ratings && currentUser.pending_ratings.length > 0) {
      setError("Please complete your pending trip ratings before posting new rides.");
      return;
    }

    if (!currentUser.drivers_license_verified) {
      setError("You must verify your driver's license before posting rides.");
      return;
    }

    if (!currentUser.vehicle_verified) {
      setError("You must verify your vehicle before posting rides.");
      return;
    }

    if (!currentUser.stripe_connect_onboarding_complete) {
      setError("You must complete Stripe Connect onboarding before posting rides.");
      return;
    }

    if (currentUser.user_type !== 'driver' && currentUser.role !== 'admin') {
      setError("You must be verified as a driver to post rides.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log('Current user profile picture:', currentUser.profile_picture_url);

      // Convert date to Hawaii timezone (UTC-10)
      // User selects date in their local timezone, we store it as Hawaii date
      const localDate = new Date(rideData.departure_date + 'T00:00:00');
      const hawaiiDate = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000));
      const hawaiiDateString = hawaiiDate.toISOString().split('T')[0];

      const ridePayload = {
        ...rideData,
        departure_date: hawaiiDateString,
        driver_id: currentUser.id,
        driver_name: currentUser.full_name,
        driver_username: currentUser.username || null,
        driver_profile_picture_url: currentUser.profile_picture_url || null,
        driver_bio: currentUser.bio || null,
        driver_age: currentUser.age || null,
        driver_gender: currentUser.gender || null,
        driver_preferences_chattiness: currentUser.preferences_chattiness || 'Flexible',
        driver_preferences_scents: currentUser.preferences_scents || 'Any',
        driver_license_state: currentUser.drivers_license_state || 'HI',
        stops: stops.filter(s => s.trim() !== ''),
        seats_available: parseInt(rideData.seats_available),
        status: 'active'
      };

      console.log('Ride payload driver_profile_picture_url:', ridePayload.driver_profile_picture_url);

      if (rideData.rider_preference === 'both_fine') {
        ridePayload.price_per_seat_local = parseFloat(rideData.price_per_seat_local);
        ridePayload.price_per_seat_tourist = parseFloat(rideData.price_per_seat_tourist);
        delete ridePayload.price_per_seat;
      } else {
        ridePayload.price_per_seat = parseFloat(rideData.price_per_seat);
        delete ridePayload.price_per_seat_local;
        delete ridePayload.price_per_seat_tourist;
      }

      await base44.entities.Ride.create(ridePayload);
      
      setRideData({
        departure_location: '',
        destination: '',
        departure_date: '',
        departure_time: '',
        is_flexible: false,
        is_last_minute: false,
        seats_available: 1,
        price_per_seat: 0,
        price_per_seat_local: 0,
        price_per_seat_tourist: 0,
        rider_preference: 'both_fine',
        description: '',
        car_model: '',
        offers_detour_service: false
      });
      setStops(['']);
      
      // Refresh user data to repopulate vehicle info
      const refreshedUser = await base44.auth.me();
      if (refreshedUser.vehicle_make && refreshedUser.vehicle_model) {
        setRideData(prev => ({
          ...prev,
          car_model: `${refreshedUser.vehicle_make} ${refreshedUser.vehicle_model} ${refreshedUser.vehicle_year || ''}`.trim()
        }));
      }
      
      alert("Ride posted successfully!");
      
    } catch (error) {
      console.error("Error creating ride:", error);
      setError("Failed to create ride. Please check your inputs.");
    }
    setIsSubmitting(false);
  };

  const canPostRide = currentUser?.profile_picture_url &&
                      currentUser?.profile_complete && 
                      currentUser?.terms_accepted && 
                      currentUser?.privacy_policy_accepted && 
                      currentUser?.community_agreement_accepted &&
                      currentUser?.drivers_license_verified && 
                      currentUser?.vehicle_verified && 
                      currentUser?.stripe_connect_onboarding_complete &&
                      (currentUser?.user_type === 'driver' || currentUser?.role === 'admin') &&
                      (!currentUser?.pending_ratings || currentUser.pending_ratings.length === 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-secondary">share your ride</h2>
        <Button
          onClick={() => setShowTutorial(true)}
          variant="outline"
          size="sm"
          className="rounded-2xl border-gray-300"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          how to post
        </Button>
      </div>

      {matchedRequest && (
        <Alert className="rounded-2xl bg-green-50 border-green-200">
          <MessageSquare className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            thanks for matching a ride request! don&apos;t forget to post the ride so the rider can book it.
          </AlertDescription>
        </Alert>
      )}

      {rideRequests.length > 0 && !matchedRequest && (
        <Card className="border-primary/20 shadow-sm bg-orange-50 rounded-3xl">
          <CardHeader className="cursor-pointer" onClick={() => setShowRideRequests(!showRideRequests)}>
            <CardTitle className="flex items-center justify-between text-secondary">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-2xl">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                before you post, view ride requests
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-2xl"
              >
                {showRideRequests ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </CardTitle>
          </CardHeader>
          {showRideRequests && (
            <CardContent className="p-6 space-y-4">
              {rideRequests.map(request => (
                <RideRequestCard
                  key={request.id}
                  request={request}
                  onMessage={handleMessageRequest}
                />
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {error && currentUser?.profile_complete && currentUser?.drivers_license_verified && (
        <Alert variant="destructive" className="rounded-2xl border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          <Card className="border-gray-200 shadow-sm bg-white rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-secondary">
                <div className="p-2 bg-primary/10 rounded-2xl">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                route details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="departure">coming from *</Label>
                  <LocationAutocomplete
                    id="departure"
                    value={rideData.departure_location}
                    onChange={(value) => handleInputChange('departure_location', value)}
                    placeholder="e.g., Lihue"
                    onValidationChange={(isUnsupported) => setHasUnsupportedLocation(prev => isUnsupported || prev)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">going to *</Label>
                  <LocationAutocomplete
                    id="destination"
                    value={rideData.destination}
                    onChange={(value) => handleInputChange('destination', value)}
                    placeholder="e.g., Hanalei"
                    onValidationChange={(isUnsupported) => setHasUnsupportedLocation(isUnsupported)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>stops (optional)</Label>
                {stops.map((stop, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input 
                      value={stop} 
                      onChange={(e) => handleStopChange(index, e.target.value)} 
                      placeholder={`stop ${index + 1}`}
                      className="rounded-2xl"
                    />
                    {stops.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeStop(index)}
                        className="rounded-2xl"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addStop}
                  className="mt-2 rounded-2xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  add stop
                </Button>
              </div>

              <div className="space-y-3">
                <Label className="text-lg font-semibold text-secondary">detours (optional)</Label>
                <p className="text-sm text-gray-600">would you like to drive riders to their end destination off the highway for an added $5?</p>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setRideData({ ...rideData, offers_detour_service: true })}
                    className={`flex-1 ${rideData.offers_detour_service ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                  >
                    yes
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setRideData({ ...rideData, offers_detour_service: false })}
                    className={`flex-1 ${!rideData.offers_detour_service ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                  >
                    no
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">trip description (why?)</Label>
                <Textarea
                  id="description"
                  value={rideData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="e.g., Going to work, beach trip, visiting family..."
                  className="h-24 rounded-2xl"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm bg-white rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-secondary">
                <div className="p-2 bg-primary/10 rounded-2xl">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">departure date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={rideData.departure_date}
                    onChange={(e) => handleInputChange('departure_date', e.target.value)}
                    required
                    className="rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">departure time *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="time"
                      type="text"
                      placeholder="e.g., 9:00"
                      value={rideData.departure_time.replace(/\s*(AM|PM)$/i, '')}
                      onChange={(e) => {
                        const period = rideData.departure_time.match(/\s*(AM|PM)$/i)?.[1] || 'AM';
                        handleInputChange('departure_time', e.target.value + ' ' + period);
                      }}
                      required
                      className="rounded-2xl flex-1"
                    />
                    <Select
                      value={rideData.departure_time.match(/\s*(AM|PM)$/i)?.[1]?.toUpperCase() || 'AM'}
                      onValueChange={(period) => {
                        const timeWithoutPeriod = rideData.departure_time.replace(/\s*(AM|PM)$/i, '').trim();
                        handleInputChange('departure_time', timeWithoutPeriod + ' ' + period);
                      }}
                    >
                      <SelectTrigger className="rounded-2xl w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="flexible">flexible departure time</Label>
                  <Switch
                    id="flexible"
                    checked={rideData.is_flexible}
                    onCheckedChange={(checked) => handleInputChange('is_flexible', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="lastminute" className="text-orange-600">
                    last minute ride (within 2 hours)
                  </Label>
                  <Switch
                    id="lastminute"
                    checked={rideData.is_last_minute}
                    onCheckedChange={(checked) => handleInputChange('is_last_minute', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm bg-white rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-secondary">
                <div className="p-2 bg-primary/10 rounded-2xl">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                vehicle & pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="carModel">car model</Label>
                <Input
                  id="carModel"
                  value={rideData.car_model}
                  onChange={(e) => handleInputChange('car_model', e.target.value)}
                  placeholder="e.g., Toyota Tacoma 2020"
                  className="rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seats">seats available</Label>
                <Select
                  value={rideData.seats_available.toString()}
                  onValueChange={(value) => handleInputChange('seats_available', parseInt(value))}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {Array.from({ length: 8 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1} seat{i > 0 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="riderPreference" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  who can ride with me
                </Label>
                <Select
                  value={rideData.rider_preference}
                  onValueChange={(value) => handleInputChange('rider_preference', value)}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="locals_only">locals only</SelectItem>
                    <SelectItem value="tourists_only">tourists only</SelectItem>
                    <SelectItem value="both_fine">both are fine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {rideData.rider_preference === 'both_fine' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="priceLocal">ride price for locals ($)</Label>
                    <Input
                      id="priceLocal"
                      type="number"
                      min="0"
                      step="1"
                      value={rideData.price_per_seat_local}
                      onChange={(e) => handleInputChange('price_per_seat_local', e.target.value)}
                      required
                      className="rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceTourist">ride price for tourists ($)</Label>
                    <Input
                      id="priceTourist"
                      type="number"
                      min="0"
                      step="1"
                      value={rideData.price_per_seat_tourist}
                      onChange={(e) => handleInputChange('price_per_seat_tourist', e.target.value)}
                      required
                      className="rounded-2xl"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="price">price per seat ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1"
                    value={rideData.price_per_seat}
                    onChange={(e) => handleInputChange('price_per_seat', e.target.value)}
                    required
                    className="rounded-2xl"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>

      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !canPostRide || hasUnsupportedLocation}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 rounded-full shadow-lg"
        >
          {isSubmitting ? 'posting...' : 'go'}
        </Button>
      </div>

      <PostRideTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      <MessageRiderModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        request={selectedRequest}
        onMessageSent={handleMessageSent}
      />
    </div>
  );
}