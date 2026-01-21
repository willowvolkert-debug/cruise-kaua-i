import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, X, Plus, AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LocationAutocomplete from "../shared/LocationAutocomplete";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function RequestRide() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [stops, setStops] = useState(['']);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [requestData, setRequestData] = useState({
    departure_location: '',
    destination: '',
    departure_date: '',
    departure_time: '',
    is_flexible: false,
    seats_needed: 1,
    description: '',
    has_luggage: false
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {
        setError("You must be logged in to request a ride.");
      }
    };
    fetchUser();
  }, []);

  const handleInputChange = (field, value) => {
    setRequestData(prev => ({ ...prev, [field]: value }));
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
      setError("You must be logged in to request a ride.");
      return;
    }

    if (!requestData.departure_location || !requestData.destination || !requestData.departure_date || !requestData.departure_time || !requestData.description) {
      setError("Please fill in all required fields.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const localDate = new Date(requestData.departure_date + 'T00:00:00');
      const hawaiiDate = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000));
      const hawaiiDateString = hawaiiDate.toISOString().split('T')[0];

      const requestPayload = {
        ...requestData,
        departure_date: hawaiiDateString,
        rider_id: currentUser.id,
        rider_name: currentUser.full_name,
        rider_username: currentUser.username || null,
        rider_profile_picture_url: currentUser.profile_picture_url || null,
        rider_bio: currentUser.bio || null,
        rider_age: currentUser.age || null,
        rider_gender: currentUser.gender || null,
        stops: stops.filter(s => s.trim() !== ''),
        seats_needed: parseInt(requestData.seats_needed),
        status: 'active'
      };

      await base44.entities.RideRequest.create(requestPayload);
      
      setRequestData({
        departure_location: '',
        destination: '',
        departure_date: '',
        departure_time: '',
        is_flexible: false,
        seats_needed: 1,
        description: '',
        has_luggage: false
      });
      setStops(['']);
      
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error("Error creating ride request:", error);
      setError("Failed to create ride request. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      <h2 className="text-2xl font-bold text-secondary">request a ride</h2>

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
                  <Label htmlFor="departure">coming from *</Label>
                  <LocationAutocomplete
                    id="departure"
                    value={requestData.departure_location}
                    onChange={(value) => handleInputChange('departure_location', value)}
                    placeholder="e.g., Lihue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">going to *</Label>
                  <LocationAutocomplete
                    id="destination"
                    value={requestData.destination}
                    onChange={(value) => handleInputChange('destination', value)}
                    placeholder="e.g., Hanalei"
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
                <Label htmlFor="description">why do you need this ride? *</Label>
                <Textarea
                  id="description"
                  value={requestData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="e.g., Going to work, need airport pickup..."
                  className="h-24 rounded-2xl"
                  required
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
                    value={requestData.departure_date}
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
                      value={requestData.departure_time.replace(/\s*(AM|PM)$/i, '')}
                      onChange={(e) => {
                        const period = requestData.departure_time.match(/\s*(AM|PM)$/i)?.[1] || 'AM';
                        handleInputChange('departure_time', e.target.value + ' ' + period);
                      }}
                      required
                      className="rounded-2xl flex-1"
                    />
                    <Select
                      value={requestData.departure_time.match(/\s*(AM|PM)$/i)?.[1]?.toUpperCase() || 'AM'}
                      onValueChange={(period) => {
                        const timeWithoutPeriod = requestData.departure_time.replace(/\s*(AM|PM)$/i, '').trim();
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

              <div className="flex items-center justify-between">
                <Label htmlFor="flexible">flexible departure time</Label>
                <Switch
                  id="flexible"
                  checked={requestData.is_flexible}
                  onCheckedChange={(checked) => handleInputChange('is_flexible', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm bg-white rounded-3xl">
            <CardHeader>
              <CardTitle className="text-secondary">additional details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="seats">seats needed *</Label>
                <Select
                  value={requestData.seats_needed.toString()}
                  onValueChange={(value) => handleInputChange('seats_needed', parseInt(value))}
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

              <div className="flex items-center justify-between">
                <Label htmlFor="luggage">do you have luggage?</Label>
                <Switch
                  id="luggage"
                  checked={requestData.has_luggage}
                  onCheckedChange={(checked) => handleInputChange('has_luggage', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 rounded-full shadow-lg"
        >
          {isSubmitting ? 'submitting...' : 'submit request'}
        </Button>
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-secondary">thanks!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              your requested ride will be shown to drivers posting rides, where they will be able to message you to book their trip.
            </p>
            <p className="text-gray-600">
              we will also message you if we find a ride that matches your request.
            </p>
            <Button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-primary hover:bg-primary/90 rounded-2xl"
            >
              got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}