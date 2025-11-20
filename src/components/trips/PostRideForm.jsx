import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, DollarSign, Car, X, Plus, AlertCircle, Clock, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PostRideForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [stops, setStops] = useState(['']);
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
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
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
    
    setIsSubmitting(true);
    try {
      const ridePayload = {
        ...rideData,
        driver_id: currentUser.id,
        driver_name: currentUser.full_name,
        driver_license_state: currentUser.drivers_license_state || 'HI',
        stops: stops.filter(s => s.trim() !== ''),
        seats_available: parseInt(rideData.seats_available),
        status: 'active'
      };

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
      });
      setStops(['']);
      
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
                      (!currentUser?.pending_ratings || currentUser.pending_ratings.length === 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      {error && (
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
                  <Label htmlFor="departure">coming from</Label>
                  <Input
                    id="departure"
                    value={rideData.departure_location}
                    onChange={(e) => handleInputChange('departure_location', e.target.value)}
                    placeholder="e.g., Lihue"
                    required
                    className="rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">going to</Label>
                  <Input
                    id="destination"
                    value={rideData.destination}
                    onChange={(e) => handleInputChange('destination', e.target.value)}
                    placeholder="e.g., Hanalei"
                    required
                    className="rounded-2xl"
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
                  <Label htmlFor="date">departure date</Label>
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
                  <Label htmlFor="time">departure time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={rideData.departure_time}
                    onChange={(e) => handleInputChange('departure_time', e.target.value)}
                    disabled={rideData.is_flexible}
                    className="rounded-2xl"
                  />
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
          disabled={isSubmitting || !canPostRide}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 rounded-full shadow-lg"
        >
          {isSubmitting ? 'posting...' : 'go'}
        </Button>
      </div>
    </div>
  );
}