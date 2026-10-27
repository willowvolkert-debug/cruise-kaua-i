import DriverEarningsBanner from "@/components/shared/DriverEarningsBanner";
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, AlertCircle, Repeat } from "lucide-react";
import { createRideRequest } from "@/functions/createRideRequest";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LocationAutocomplete from "../shared/LocationAutocomplete";
import TimeInput from "../shared/TimeInput";
import DatePickerButton from "../shared/DatePickerButton";
import HaenaInfoView from "./HaenaInfoView";
import HaenaWarningCard from "./HaenaWarningCard";
import ProfileIncompleteModal from "./ProfileIncompleteModal";
import RecurringRequests from "./RecurringRequests";
import RequestSuccess from "./RequestSuccess";
import {
  flowHeading, flowLabel, flowHint, flowField, flowTextarea,
  flowToggleRow, flowButton, flowSection,
} from "./flowStyles";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EMPTY_REQUEST = {
  departure_location: '',
  destination: '',
  departure_date: '',
  departure_time: '',
  is_flexible: false,
  seats_needed: 1,
  description: '',
  has_luggage: false
};

export default function RequestRide({ island = "Kauai" }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [stops, setStops] = useState(['']);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [postedRequest, setPostedRequest] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState([]);
  const [recurringKey, setRecurringKey] = useState(0);
  const [showHaenaInfo, setShowHaenaInfo] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [missingProfileItems, setMissingProfileItems] = useState([]);
  const [requestData, setRequestData] = useState(EMPTY_REQUEST);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/join?login=true&next=${next}`;
    });
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
        setRecurringKey(k => k + 1);
      }

      setRequestData(EMPTY_REQUEST);
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
    <div className="space-y-8 max-w-4xl mx-auto relative">
      <h2 className="text-3xl font-bold text-secondary">request a ride</h2>
      <DriverEarningsBanner />

      {error && (
        <Alert variant="destructive" className="rounded-lg border-red-200">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="text-base">{error}</AlertDescription>
        </Alert>
      )}

      <RecurringRequests refreshKey={recurringKey} />

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className={flowSection}>
          <p className={flowHeading}>📍 pick your route</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="departure" className={flowLabel}>coming from *</Label>
              <LocationAutocomplete
                id="departure"
                value={requestData.departure_location}
                onChange={(value) => handleInputChange('departure_location', value)}
                placeholder="e.g., Lihue"
                island={island}
                className={flowField}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination" className={flowLabel}>going to *</Label>
              <LocationAutocomplete
                id="destination"
                value={requestData.destination}
                onChange={(value) => handleInputChange('destination', value)}
                placeholder="e.g., Hanalei"
                island={island}
                className={flowField}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className={flowLabel}>stops <span className="font-normal text-gray-400">(optional)</span></Label>
            {stops.map((stop, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={stop}
                  onChange={(e) => handleStopChange(index, e.target.value)}
                  placeholder={`stop ${index + 1}`}
                  className={flowField}
                />
                {stops.length > 1 && (
                  <Button type="button" variant="outline" onClick={() => removeStop(index)} className="h-16 w-16 rounded-lg border-2 border-gray-300 shrink-0">
                    <X className="w-6 h-6" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addStop} className="h-14 px-6 text-lg rounded-lg border-2 border-gray-300">
              <Plus className="w-5 h-5 mr-2" /> add stop
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className={flowLabel}>why do you need this ride? *</Label>
            <Textarea
              id="description"
              value={requestData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="e.g., Going to work, need airport pickup..."
              className={flowTextarea}
              required
            />
          </div>
        </section>

        <section className={flowSection}>
          <p className={flowHeading}>📅 pick your date &amp; time</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className={flowLabel}>departure date *</Label>
              <DatePickerButton
                value={requestData.departure_date}
                onChange={(d) => handleInputChange('departure_date', d)}
                placeholder="select a date"
                className="h-16 text-lg rounded-lg border-gray-300 px-4 [&_svg]:w-5 [&_svg]:h-5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className={flowLabel}>departure time *</Label>
              <TimeInput
                id="time"
                value={requestData.departure_time}
                onChange={(v) => handleInputChange('departure_time', v)}
                required
                className={`${flowField} w-full`}
              />
            </div>
          </div>

          <div className={flowToggleRow}>
            <Label htmlFor="flexible" className={flowLabel}>flexible departure time</Label>
            <Switch id="flexible" checked={requestData.is_flexible} onCheckedChange={(c) => handleInputChange('is_flexible', c)} />
          </div>

          <div className="rounded-lg border-2 border-gray-300 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="recurring" className={`${flowLabel} flex items-center gap-2`}>
                  <Repeat className="w-5 h-5 text-secondary" /> recurring request
                </Label>
                <p className={flowHint}>auto-post this request weekly on selected days</p>
              </div>
              <Switch id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
            {isRecurring && (
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {DAYS.map((day, idx) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setRecurringDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx])}
                    className={`h-14 rounded-lg text-lg font-bold border-2 transition-colors select-none ${
                      recurringDays.includes(idx)
                        ? 'bg-secondary text-white border-secondary'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-secondary'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5">
          <p className={flowHeading}>🙋 additional details</p>
          <div className="space-y-2">
            <Label className={flowLabel}>seats needed *</Label>
            <Select
              value={requestData.seats_needed.toString()}
              onValueChange={(value) => handleInputChange('seats_needed', parseInt(value))}
            >
              <SelectTrigger className={flowField}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {Array.from({ length: 8 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()} className="text-lg py-3">
                    {i + 1} seat{i > 0 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={flowToggleRow}>
            <Label htmlFor="luggage" className={flowLabel}>do you have luggage?</Label>
            <Switch id="luggage" checked={requestData.has_luggage} onCheckedChange={(c) => handleInputChange('has_luggage', c)} />
          </div>
        </section>
      </form>

      <RequestSuccess
        postedRequest={postedRequest}
        showModal={showSuccessModal}
        setShowModal={setShowSuccessModal}
        currentUser={currentUser}
        onReturn={() => {
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
        onDismiss={() => setPostedRequest(null)}
      />

      <div className="pb-8 space-y-4">
        <Button onClick={handleSubmit} disabled={isSubmitting} className={flowButton}>
          {isSubmitting ? "submitting..." : "submit ride request"}
        </Button>
        <p className="text-center text-base text-gray-500">
          <a href="/inbox" className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium">
            edit a pre-existing ride request here →
          </a>
        </p>
        <HaenaWarningCard onClick={() => setShowHaenaInfo(true)} />
      </div>

      <ProfileIncompleteModal
        isOpen={showProfileModal}
        missingItems={missingProfileItems}
        action="request a ride"
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}