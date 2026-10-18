import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, X, Plus, AlertCircle, Clock, Repeat, RefreshCw } from "lucide-react";
import { createRideRequest } from "@/functions/createRideRequest";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LocationAutocomplete from "../shared/LocationAutocomplete";
import TimeInput from "../shared/TimeInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import HaenaInfoView from "./HaenaInfoView";
import HaenaWarningCard from "./HaenaWarningCard";
import ProfileIncompleteModal from "./ProfileIncompleteModal";

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function RequestRide({ island = "Kauai" }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [stops, setStops] = useState(['']);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [postedRequest, setPostedRequest] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState([]);
  const [myRecurring, setMyRecurring] = useState([]);
  const [showHaenaInfo, setShowHaenaInfo] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [missingProfileItems, setMissingProfileItems] = useState([]);
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

        // Load recurring ride requests
        const recurring = await base44.entities.RecurringRideRequest.filter({ user_id: user.id });
        setMyRecurring(recurring);

      } catch (e) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/join?login=true&next=${next}`;
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
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/join?login=true&next=${next}`;
      return;
    }

    const missing = [];
    if (!currentUser.profile_picture_url) missing.push("upload a profile photo");
    if (!currentUser.profile_complete) missing.push("complete your profile (username, bio, age, gender)");
    if (!currentUser.terms_accepted || !currentUser.privacy_policy_accepted || !currentUser.community_agreement_accepted) missing.push("accept the legal agreements");

    if (missing.length > 0) {
      setMissingProfileItems(missing);
      setShowProfileModal(true);
      return;
    }

    if (!requestData.departure_location || !requestData.destination || !requestData.departure_date || !requestData.departure_time || !requestData.description) {
      setError("Please fill in all required fields.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // The <input type="date"> already gives a clean yyyy-MM-dd calendar date
      // string with no timezone. Previous code did convoluted timezone math
      // (new Date + getTimezoneOffset) that could shift the date by a day for
      // users not in HST — the "showing a different date than I chose" bug.
      const riderDisplayName = currentUser.full_name || currentUser.username || currentUser.email?.split('@')[0] || 'Cruise member';

      const requestPayload = {
        ...requestData,
        departure_date: requestData.departure_date,
        rider_id: currentUser.id,
        rider_name: riderDisplayName,
        rider_username: currentUser.username || null,
        rider_profile_picture_url: currentUser.profile_picture_url || null,
        rider_bio: currentUser.bio || null,
        rider_age: currentUser.age || null,
        rider_gender: currentUser.gender || null,
        stops: stops.filter(s => s.trim() !== ''),
        seats_needed: parseInt(requestData.seats_needed),
        island: island,
        status: 'active'
      };

      const response = await createRideRequest({ payload: requestPayload });
      if (!response.data?.success) throw new Error(response.data?.error || 'Failed to submit');
      const newRequest = { ...requestPayload, id: response.data?.id };

      // Save recurring ride request if enabled
      if (isRecurring && recurringDays.length > 0) {
        await base44.entities.RecurringRideRequest.create({
          user_id: currentUser.id,
          departure_location: requestData.departure_location,
          destination: requestData.destination,
          stops: stops.filter(s => s.trim() !== ''),
          departure_time: requestData.departure_time,
          is_flexible: requestData.is_flexible,
          seats_needed: parseInt(requestData.seats_needed),
          description: requestData.description,
          has_luggage: requestData.has_luggage,
          schedule_type: 'weekly',
          weekly_days: recurringDays,
          is_active: true,
          rider_name: riderDisplayName,
          rider_username: currentUser.username || null,
          rider_profile_picture_url: currentUser.profile_picture_url || null,
          rider_bio: currentUser.bio || null,
          rider_age: currentUser.age || null,
          rider_gender: currentUser.gender || null,
        });
      }

      // Driver matching and ride-request-to-ride matching are now done
      // server-side in the createRideRequest backend function using
      // zone-based location matching. No more client-side User.list() call.
      
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
      setIsRecurring(false);
      setRecurringDays([]);
      setPostedRequest(newRequest);
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error("Error creating ride request:", error);
      setError("Failed to create ride request. Please try again.");
    }
    setIsSubmitting(false);
  };

  if (showHaenaInfo) {
    return <HaenaInfoView onBack={() => setShowHaenaInfo(false)} />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      <h2 className="text-2xl font-bold text-secondary">request a ride</h2>

      <HaenaWarningCard onClick={() => setShowHaenaInfo(true)} />

      {error && (
        <Alert variant="destructive" className="rounded-2xl border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {myRecurring.length > 0 && (
        <Card className="border-secondary/20 bg-blue-50 rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-secondary text-base">
              <Repeat className="w-5 h-5" />
              your recurring ride requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {myRecurring.map(r => (
              <div key={r.id} className="flex items-start justify-between bg-white rounded-2xl p-3 border border-secondary/20">
                <div className="flex-1">
                  <p className="font-medium text-secondary text-sm">{r.departure_location} → {r.destination}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(r.weekly_days || []).map(d => DAY_NAMES[d]).join(', ')} • {r.departure_time}
                  </p>
                </div>
                <Switch
                  checked={r.is_active}
                  onCheckedChange={async (val) => {
                    await base44.entities.RecurringRideRequest.update(r.id, { is_active: val });
                    setMyRecurring(prev => prev.map(x => x.id === r.id ? { ...x, is_active: val } : x));
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
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
                    island={island}
                    />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">going to *</Label>
                  <LocationAutocomplete
                    id="destination"
                    value={requestData.destination}
                    onChange={(value) => handleInputChange('destination', value)}
                    placeholder="e.g., Hanalei"
                    island={island}
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
                    lang="en"
                    value={requestData.departure_date}
                    onChange={(e) => handleInputChange('departure_date', e.target.value)}
                    required
                    className="rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                   <Label htmlFor="time">departure time *</Label>
                   <TimeInput
                     id="time"
                     value={requestData.departure_time}
                     onChange={(v) => handleInputChange('departure_time', v)}
                     required
                     className="rounded-2xl w-full"
                   />
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

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="recurring" className="font-medium flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-secondary" />
                      recurring request
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">auto-post this request weekly on selected days</p>
                  </div>
                  <Switch
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </div>
                {isRecurring && (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">which days?</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, idx) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setRecurringDays(prev =>
                            prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                          )}
                          className={`px-3 py-1.5 rounded-2xl text-sm font-medium border transition-colors ${
                            recurringDays.includes(idx)
                              ? 'bg-secondary text-white border-secondary'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-secondary'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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

      {postedRequest && (
        <Card className="border-green-300 bg-green-50 rounded-3xl shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-2xl">
                <MapPin className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="font-bold text-green-800 text-lg">request submitted! 🎉</p>
                <p className="text-sm text-green-700">{postedRequest.departure_location} → {postedRequest.destination}</p>
              </div>
            </div>
            <p className="text-green-800 font-medium">want to also request a return ride?</p>
            <p className="text-sm text-green-700">
              <a href="/inbox" className="font-semibold underline underline-offset-2 hover:text-green-900">edit a pre-existing ride request here →</a>
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                className="flex-1 bg-green-600 hover:bg-green-700 rounded-2xl"
                onClick={() => {
                  setRequestData(prev => ({
                    ...prev,
                    departure_location: postedRequest.destination,
                    destination: postedRequest.departure_location,
                    departure_date: '',
                    departure_time: '',
                  }));
                  setStops(['']);
                  setPostedRequest(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                yes, pre-fill return request
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-2xl border-green-400 text-green-700"
                onClick={() => setPostedRequest(null)}
              >
                no thanks
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="pb-8 space-y-2">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-2xl shadow-lg"
        >
          {isSubmitting ? "submitting..." : "submit ride request"}
        </Button>
        <p className="text-center text-sm text-gray-500">
          <a href="/inbox" className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium">
            edit a pre-existing ride request here →
          </a>
        </p>
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
            {!currentUser?.drivers_license_verified && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                <p className="text-sm text-amber-800">
                  🪪 before you can ride, you'll need to upload your driver's license.{" "}
                  <a href="/account" className="font-semibold underline underline-offset-2">go to your account to upload it →</a>
                </p>
              </div>
            )}
            <Button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-primary hover:bg-primary/90 rounded-2xl"
            >
              got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProfileIncompleteModal
        isOpen={showProfileModal}
        missingItems={missingProfileItems}
        action="request a ride"
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}