import DriverEarningsBanner from "@/components/shared/DriverEarningsBanner";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Car, X, Plus, AlertCircle, Clock, Users, HelpCircle, MessageSquare, ChevronDown, ChevronUp, Repeat, Pencil, Lightbulb, AlertTriangle, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getPricingInfo } from "./pricingUtils";
import PostRideTutorial from "../tutorial/PostRideTutorial";
import LocationAutocomplete from "../shared/LocationAutocomplete";
import TimeInput from "../shared/TimeInput";
import RideRequestCard from "./RideRequestCard";
import MessageRiderModal from "./MessageRiderModal";
import RecurringTripModal from "./RecurringTripModal";
import RecurringAutoPostModal from "./RecurringAutoPostModal";
import RiderProfileModal from "./RiderProfileModal";
import ProfileIncompleteModal from "./ProfileIncompleteModal";
import { useDraftSave, loadDraft, clearDraft } from "@/hooks/useDraftSave";
import DatePickerButton from "../shared/DatePickerButton";
import {
  flowHeading, flowLabel, flowHint, flowField, flowTextarea,
  flowToggleRow, flowButton, flowSection,
} from "./flowStyles";

export default function PostRideForm({ island = "Kauai", initialRespondingToRequest = null }) {
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
  const [respondingToRequest, setRespondingToRequest] = useState(null);
  const [showRideRequests, setShowRideRequests] = useState(true);
  const [recurringTrips, setRecurringTrips] = useState([]);
  const [showRecurringTrips, setShowRecurringTrips] = useState(true);
  const [showRecurringTripModal, setShowRecurringTripModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [showRiderProfileModal, setShowRiderProfileModal] = useState(false);
  const [selectedRiderRequest, setSelectedRiderRequest] = useState(null);
  const [riderRatings, setRiderRatings] = useState([]);
  const [showAutoPostModal, setShowAutoPostModal] = useState(false);
  const [autoPostTrip, setAutoPostTrip] = useState(null);
  const [recurringSchedules, setRecurringSchedules] = useState([]);
  const [postedRide, setPostedRide] = useState(null);
  const [pricingSuggestion, setPricingSuggestion] = useState(null);
  const [priceCapWarning, setPriceCapWarning] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [missingProfileItems, setMissingProfileItems] = useState([]);

  const DRAFT_KEY = 'draft_post_ride';
  const _savedDraft = loadDraft(DRAFT_KEY);
  const [rideData, setRideData] = useState({
    departure_location: _savedDraft?.departure_location || '',
    destination: _savedDraft?.destination || '',
    departure_date: _savedDraft?.departure_date || '',
    departure_time: _savedDraft?.departure_time || '',
    is_flexible: _savedDraft?.is_flexible || false,
    is_last_minute: _savedDraft?.is_last_minute || false,
    seats_available: _savedDraft?.seats_available || 1,
    price_per_seat: _savedDraft?.price_per_seat || 0,
    price_per_seat_local: _savedDraft?.price_per_seat_local || 0,
    price_per_seat_tourist: _savedDraft?.price_per_seat_tourist || 0,
    rider_preference: _savedDraft?.rider_preference || 'both_fine',
    description: _savedDraft?.description || '',
    car_model: _savedDraft?.car_model || '',
    offers_detour_service: _savedDraft?.offers_detour_service || false,
    offers_midpoint_pickup: _savedDraft?.offers_midpoint_pickup || false
  });

  // Auto-save draft on every change
  useDraftSave(DRAFT_KEY, rideData);

  // Pre-fill from a ride request passed in from BrowseRideRequests
  useEffect(() => {
    if (initialRespondingToRequest) {
      handleRespondWithRide(initialRespondingToRequest);
    }
  }, [initialRespondingToRequest]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        // Fetch active ride requests filtered by island
        const requests = await base44.entities.RidePost.filter({ status: 'active', island });
        
        // Get current Hawaii time
        const now = new Date();
        const hawaiiOffset = -10 * 60; // Hawaii is UTC-10
        const hawaiiTime = new Date(now.getTime() + (hawaiiOffset + now.getTimezoneOffset()) * 60000);
        
        // Filter out past requests
        const futureRequests = requests.filter(request => {
          if (!request.departure_date || !request.departure_time) return false;
          
          // Parse request date - handle both formats
          let year, month, day;
          if (request.departure_date.includes('T')) {
            // ISO format: 2026-02-11T10:00:00.000Z
            const date = new Date(request.departure_date);
            year = date.getFullYear();
            month = date.getMonth() + 1;
            day = date.getDate();
          } else {
            // Simple format: 2026-02-11
            [year, month, day] = request.departure_date.split('-').map(Number);
          }
          
          const timeStr = request.departure_time.toLowerCase().trim();
          
          // Parse time — handles "7 PM", "7PM", "7:30 PM", "14:00", etc.
          let hours = 0, minutes = 0;
          if (timeStr.includes(':')) {
            const [h, m] = timeStr.replace(/[ap]m/i, '').trim().split(':').map(Number);
            hours = h;
            minutes = m || 0;
            if (timeStr.includes('pm') && hours < 12) hours += 12;
            if (timeStr.includes('am') && hours === 12) hours = 0;
          } else {
            // No colon — e.g. "7 pm", "7pm", "3 am"
            const match = timeStr.match(/(\d+)\s*([ap]m)/i);
            if (match) {
              hours = parseInt(match[1]);
              if (match[2].toLowerCase() === 'pm' && hours < 12) hours += 12;
              if (match[2].toLowerCase() === 'am' && hours === 12) hours = 0;
            }
          }
          
          // Create request datetime in Hawaii timezone
          const requestDateTime = new Date(year, month - 1, day, hours, minutes);
          
          // Return true if request is in the future
          return requestDateTime > hawaiiTime;
        });
        
        setRideRequests(futureRequests);

        // Fetch recurring trips
        const trips = await base44.entities.RecurringTrip.filter({ user_id: user.id });
        setRecurringTrips(trips);

        // Fetch recurring schedules
        const schedules = await base44.entities.RecurringSchedule.filter({ user_id: user.id });
        setRecurringSchedules(schedules);
        
        const missing = [];
        if (!user.profile_picture_url) missing.push("upload a profile photo");
        if (!user.profile_complete) missing.push("complete your profile (username, bio, age, gender)");
        if (!user.terms_accepted || !user.privacy_policy_accepted || !user.community_agreement_accepted) missing.push("accept the legal agreements");
        if (!user.drivers_license_verified) missing.push("verify your driver's license");
        if (!user.vehicle_verified) missing.push("verify your vehicle details");
        if (user.user_type !== 'driver' && user.role !== 'admin') missing.push("get verified as a driver");
        if (user.pending_ratings && user.pending_ratings.length > 0) missing.push("complete your pending trip ratings in the Inbox");

        if (missing.length > 0) {
          setMissingProfileItems(missing);
          setShowProfileModal(true);
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
    setRideData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'departure_location' || field === 'destination') {
        const from = field === 'departure_location' ? value : prev.departure_location;
        const to = field === 'destination' ? value : prev.destination;
        if (from && to) {
          const { suggestion, cap } = getPricingInfo(from, to);
          setPricingSuggestion(suggestion);
          setPriceCapWarning(cap);
        } else {
          setPricingSuggestion(null);
          setPriceCapWarning(null);
        }
      }
      return updated;
    });
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

  const handleViewRiderProfile = async (request) => {
    setSelectedRiderRequest(request);
    // Load rider ratings
    try {
      const allRatings = await base44.entities.Rating.list();
      const ratingsForRider = allRatings.filter(r => 
        String(r.rated_user_id) === String(request.rider_id) && 
        r.trip_role === 'passenger'
      );
      setRiderRatings(ratingsForRider);
    } catch (e) {
      console.error("Error loading ratings:", e);
      setRiderRatings([]);
    }
    setShowRiderProfileModal(true);
  };

  const handleRespondWithRide = (request) => {
    setRespondingToRequest(request);
    setRideData(prev => ({
      ...prev,
      departure_location: request.departure_location,
      destination: request.destination,
      departure_date: request.departure_date?.substring(0, 10) || '',
      departure_time: request.departure_time || '',
      is_flexible: request.is_flexible || false,
      seats_available: request.seats_needed || 1,
    }));
    if (request.stops && request.stops.length > 0) setStops(request.stops);
    const { suggestion, cap } = getPricingInfo(request.departure_location, request.destination);
    setPricingSuggestion(suggestion);
    setPriceCapWarning(cap);
    // Scroll down to the form
    setTimeout(() => window.scrollTo({ top: 400, behavior: 'smooth' }), 100);
  };

  const handleMessageSent = (request) => {
    setMatchedRequest(request);
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
    const { suggestion, cap } = getPricingInfo(request.departure_location, request.destination);
    setPricingSuggestion(suggestion);
    setPriceCapWarning(cap);
  };

  const handleSelectRecurringTrip = (trip) => {
    setRideData(prev => ({
      ...prev,
      departure_location: trip.departure_location,
      destination: trip.destination,
      departure_time: trip.departure_time,
      is_flexible: trip.is_flexible,
      seats_available: trip.seats_available,
      price_per_seat: trip.price_per_seat || 0,
      price_per_seat_local: trip.price_per_seat_local || 0,
      price_per_seat_tourist: trip.price_per_seat_tourist || 0,
      rider_preference: trip.rider_preference,
      description: trip.description,
      car_model: trip.car_model,
      smoking_allowed: trip.smoking_allowed,
      pets_allowed: trip.pets_allowed,
      offers_detour_service: trip.offers_detour_service
    }));
    if (trip.stops && trip.stops.length > 0) {
      setStops(trip.stops);
    }
    const { suggestion, cap } = getPricingInfo(trip.departure_location, trip.destination);
    setPricingSuggestion(suggestion);
    setPriceCapWarning(cap);
  };

  const handleEditTrip = (trip, e) => {
    e.stopPropagation();
    setEditingTrip(trip);
    setShowRecurringTripModal(true);
  };

  const handleSaveTrip = (savedTrip) => {
    if (editingTrip) {
      setRecurringTrips(recurringTrips.map(t => t.id === savedTrip.id ? savedTrip : t));
      setEditingTrip(null);
    } else {
      setRecurringTrips([...recurringTrips, savedTrip]);
    }
  };

  const handleDeleteTrip = async (trip, e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${trip.trip_name}"?`)) return;
    await base44.entities.RecurringTrip.delete(trip.id);
    setRecurringTrips(recurringTrips.filter(t => t.id !== trip.id));
  };

  const handleCloseModal = () => {
    setShowRecurringTripModal(false);
    setEditingTrip(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!currentUser) {
      setError("You must be logged in to post a ride.");
      return;
    }

    const missing = [];
    if (!currentUser.profile_picture_url) missing.push("upload a profile photo");
    if (!currentUser.profile_complete) missing.push("complete your profile (username, bio, age, gender)");
    if (!currentUser.terms_accepted || !currentUser.privacy_policy_accepted || !currentUser.community_agreement_accepted) missing.push("accept the legal agreements");
    if (!currentUser.drivers_license_verified) missing.push("verify your driver's license");
    if (!currentUser.vehicle_verified) missing.push("verify your vehicle details");
    if (currentUser.user_type !== 'driver' && currentUser.role !== 'admin') missing.push("get verified as a driver");
    if (currentUser.pending_ratings && currentUser.pending_ratings.length > 0) missing.push("complete your pending trip ratings in the Inbox");

    if (missing.length > 0) {
      setMissingProfileItems(missing);
      setShowProfileModal(true);
      return;
    }

    if (!rideData.departure_location || !rideData.destination || !rideData.departure_date || !rideData.departure_time.replace(/\s*(AM|PM)$/i, '').trim()) {
      setError("Please fill in all required fields: coming from, going to, departure date, and departure time.");
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

      const driverDisplayName = currentUser.full_name || currentUser.username || currentUser.email?.split('@')[0] || 'Cruise member';

      const ridePayload = {
        ...rideData,
        departure_date: hawaiiDateString,
        driver_id: currentUser.id,
        driver_name: driverDisplayName,
        driver_username: currentUser.username || null,
        driver_profile_picture_url: currentUser.profile_picture_url || null,
        driver_bio: currentUser.bio || null,
        driver_age: currentUser.age || null,
        driver_gender: currentUser.gender || null,
        driver_preferences_chattiness: currentUser.preferences_chattiness || 'Flexible',
        driver_preferences_scents: currentUser.preferences_scents || 'Any',
        driver_license_state: currentUser.drivers_license_state || 'HI',
        driver_vehicle_exterior_photo_url: currentUser.vehicle_exterior_photo_url || null,
        driver_vehicle_interior_photo_urls: currentUser.vehicle_interior_photo_urls || [],
        stops: stops.filter(s => s.trim() !== ''),
        seats_available: parseInt(rideData.seats_available),
        island: island,
        status: 'active'
      };

      console.log('Ride payload driver_profile_picture_url:', ridePayload.driver_profile_picture_url);

      if (rideData.rider_preference === 'both_fine') {
        ridePayload.price_per_seat_local = parseFloat(rideData.price_per_seat_local) || 0;
        ridePayload.price_per_seat_tourist = parseFloat(rideData.price_per_seat_tourist) || 0;
        delete ridePayload.price_per_seat;
      } else {
        ridePayload.price_per_seat = parseFloat(rideData.price_per_seat) || 0;
        delete ridePayload.price_per_seat_local;
        delete ridePayload.price_per_seat_tourist;
      }

      const newRide = await base44.entities.Ride.create(ridePayload);

      // If responding to a specific ride request, notify the requester
      if (respondingToRequest) {
        try {
          await base44.integrations.Core.SendEmail({
            to: respondingToRequest.rider_email || '',
            subject: `A driver responded to your ride request!`,
            body: `Aloha ${respondingToRequest.rider_name},\n\nA driver has posted a ride that matches your request!\n\nRoute: ${ridePayload.departure_location} → ${ridePayload.destination}\nDate: ${ridePayload.departure_date}\nTime: ${ridePayload.departure_time}\n\nLog in to Cruise Hawaiʻi to book it: https://cruisekauai.org\n\nMahalo,\nCruise Hawaiʻi Team`
          });
        } catch (e) { /* email optional */ }
        // Also send an in-app notification
        try {
          await base44.entities.AdminMessage.create({
            recipient_id: respondingToRequest.rider_id,
            recipient_name: respondingToRequest.rider_name,
            subject: 'A driver responded to your ride request!',
            message: `A driver has posted a ride matching your request (${respondingToRequest.departure_location} → ${respondingToRequest.destination} on ${ridePayload.departure_date}). Check the "find a ride" tab to book it!`,
            message_type: 'info'
          });
        } catch (e) { /* notification optional */ }
        setRespondingToRequest(null);
      }

      clearDraft(DRAFT_KEY);
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
        offers_detour_service: false,
        offers_midpoint_pickup: false
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

      setPostedRide(newRide);
      
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
                      (currentUser?.user_type === 'driver' || currentUser?.role === 'admin') &&
                      (!currentUser?.pending_ratings || currentUser.pending_ratings.length === 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="cruise-head text-5xl md:text-6xl text-secondary leading-none">post a ride</h1>
          <DriverEarningsBanner className="text-xl font-semibold text-primary mt-2" />
          <p className="text-lg text-gray-900 mt-3 leading-snug">offer seats on the trips you're already making</p>
        </div>
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
      <p className="text-sm text-gray-500 -mt-2 mb-2">
        <Link to="/confirmedrides" className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium">edit a pre-existing ride here →</Link>
      </p>

      {respondingToRequest && (
        <Alert className="rounded-2xl bg-blue-50 border-blue-200">
          <Car className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            responding to <strong>@{respondingToRequest.rider_username || respondingToRequest.rider_name}</strong>'s request — the form has been pre-filled. fill in pricing and post!
          </AlertDescription>
        </Alert>
      )}

      {matchedRequest && !respondingToRequest && (
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
                  onViewProfile={handleViewRiderProfile}
                  onRespondWithRide={handleRespondWithRide}
                />
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {currentUser && (!currentUser.drivers_license_verified || !currentUser.vehicle_verified) && (
        <Alert className="rounded-2xl border-amber-300 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            you can't post a ride yet because you haven't submitted your license & vehicle info.{" "}
            <a href="/VehicleDetails" className="font-semibold underline hover:text-amber-900">
              click here to submit your license & vehicle information
            </a>
          </AlertDescription>
        </Alert>
      )}

      {error && currentUser?.profile_complete && currentUser?.drivers_license_verified && currentUser?.vehicle_verified && (
        <Alert variant="destructive" className="rounded-2xl border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Recurring Trips */}
      <div className="space-y-4 pb-8 border-b-2 border-gray-200">
        <button type="button" onClick={() => setShowRecurringTrips(!showRecurringTrips)} className="w-full flex items-center justify-between select-none">
          <span className={`${flowHeading} flex items-center gap-2`}>
            <Repeat className="w-6 h-6 text-primary" /> your recurring trips
          </span>
          {showRecurringTrips ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
        </button>
        {showRecurringTrips && (
          <div className="space-y-4">
            <p className={flowHint}>
              have your daily drive down? add a recurring trip here. when you press on it, the drive details will automatically populate below, and the only field you have to fill out is the date.
            </p>
            <Button
              type="button"
              onClick={() => setShowRecurringTripModal(true)}
              className="w-full h-14 text-lg rounded-lg bg-secondary hover:bg-secondary/90 text-white select-none"
            >
              <Plus className="w-5 h-5 mr-2" />
              add recurring trip
            </Button>
            {recurringTrips.length > 0 && (
              <div className="space-y-2">
                {recurringTrips.map(trip => (
                  <div
                    key={trip.id}
                    className={`${flowToggleRow} cursor-pointer hover:border-primary items-start`}
                    onClick={() => handleSelectRecurringTrip(trip)}
                  >
                    <>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-secondary">{trip.trip_name}</h4>
                        <p className="text-base text-gray-600">
                          {trip.departure_location} → {trip.destination}
                        </p>
                        <p className="text-base text-gray-500">
                          {trip.departure_time} • {trip.seats_available} seats
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleEditTrip(trip, e)}
                            className="rounded-2xl"
                          >
                            <Pencil className="w-4 h-4 text-gray-500" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDeleteTrip(trip, e)}
                            className="rounded-2xl"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAutoPostTrip(trip);
                            setShowAutoPostModal(true);
                          }}
                          className={`rounded-2xl text-xs px-2 py-1 h-auto ${
                            recurringSchedules.find(s => s.recurring_trip_id === trip.id && s.is_active)
                              ? "border-green-400 text-green-700 bg-green-50"
                              : "border-secondary text-secondary"
                          }`}
                        >
                          <Repeat className="w-3 h-3 mr-1" />
                          {recurringSchedules.find(s => s.recurring_trip_id === trip.id && s.is_active)
                            ? "auto-posting ✓"
                            : "post automatically?"}
                        </Button>
                      </div>
                    </>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className={flowSection}>
          <p className={flowHeading}>📍 pick your route</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="departure" className={flowLabel}>coming from *</Label>
              <LocationAutocomplete
                id="departure"
                value={rideData.departure_location}
                onChange={(value) => handleInputChange('departure_location', value)}
                placeholder="e.g., Lihue"
                onValidationChange={(isUnsupported) => setHasUnsupportedLocation(prev => isUnsupported || prev)}
                island={island}
                className={flowField}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination" className={flowLabel}>going to *</Label>
              <LocationAutocomplete
                id="destination"
                value={rideData.destination}
                onChange={(value) => handleInputChange('destination', value)}
                placeholder="e.g., Hanalei"
                onValidationChange={(isUnsupported) => setHasUnsupportedLocation(isUnsupported)}
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

          <div className={flowToggleRow}>
            <div>
              <Label htmlFor="midpointPickup" className={flowLabel}>pickup/dropoff along the way</Label>
              <p className={flowHint}>can you pick up or drop off riders along your route?</p>
            </div>
            <Switch
              id="midpointPickup"
              checked={rideData.offers_midpoint_pickup}
              onCheckedChange={(checked) => handleInputChange('offers_midpoint_pickup', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className={flowLabel}>why are you making this trip? *</Label>
            <Textarea
              id="description"
              value={rideData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="e.g., Going to work, beach trip, visiting family..."
              className={flowTextarea}
            />
          </div>
        </section>

        <section className={flowSection}>
          <p className={flowHeading}>📅 pick your date &amp; time</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className={flowLabel}>departure date *</Label>
              <DatePickerButton
                value={rideData.departure_date}
                onChange={(d) => handleInputChange('departure_date', d)}
                placeholder="select a date"
                className="h-16 text-lg rounded-lg border-gray-300 px-4 [&_svg]:w-5 [&_svg]:h-5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className={flowLabel}>departure time *</Label>
              <TimeInput
                id="time"
                value={rideData.departure_time}
                onChange={(v) => handleInputChange('departure_time', v)}
                required
                className={`${flowField} w-full`}
              />
            </div>
          </div>

          <div className={flowToggleRow}>
            <Label htmlFor="flexible" className={flowLabel}>flexible departure time</Label>
            <Switch id="flexible" checked={rideData.is_flexible} onCheckedChange={(checked) => handleInputChange('is_flexible', checked)} />
          </div>
          <div className={flowToggleRow}>
            <Label htmlFor="lastminute" className={`${flowLabel} text-orange-600`}>last minute ride (within 2 hours)</Label>
            <Switch id="lastminute" checked={rideData.is_last_minute} onCheckedChange={(checked) => handleInputChange('is_last_minute', checked)} />
          </div>
        </section>

        <section className="space-y-5">
          <p className={flowHeading}>🚗 vehicle &amp; pricing</p>
          <div className="space-y-2">
            <Label htmlFor="carModel" className={flowLabel}>car model</Label>
            <Input
              id="carModel"
              value={rideData.car_model}
              onChange={(e) => handleInputChange('car_model', e.target.value)}
              placeholder="e.g., Toyota Tacoma 2020"
              className={flowField}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seats" className={flowLabel}>seats available</Label>
            <Select
              value={rideData.seats_available.toString()}
              onValueChange={(value) => handleInputChange('seats_available', parseInt(value))}
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

          <div className="space-y-2">
            <Label htmlFor="riderPreference" className={flowLabel}>who can ride with me</Label>
            <Select
              value={rideData.rider_preference}
              onValueChange={(value) => handleInputChange('rider_preference', value)}
            >
              <SelectTrigger className={flowField}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="locals_only" className="text-lg py-3">locals only</SelectItem>
                <SelectItem value="tourists_only" className="text-lg py-3">tourists only</SelectItem>
                <SelectItem value="both_fine" className="text-lg py-3">both are fine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pricingSuggestion && (
            <div className="rounded-lg bg-blue-50 border-2 border-blue-200 p-5 space-y-2">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-lg">
                <Lightbulb className="w-5 h-5" />
                suggested price ({pricingSuggestion.distance} miles)
              </div>
              <div className="flex gap-6 text-lg text-blue-700">
                <span>local: <strong>${pricingSuggestion.local}</strong></span>
                <span>visitor: <strong>${pricingSuggestion.visitor}</strong></span>
              </div>
              {priceCapWarning && (
                <div className="flex items-start gap-2 text-amber-700 text-base mt-1">
                  <AlertTriangle className="w-4 h-4 mt-1 flex-shrink-0" />
                  <span>
                    IRS business rate max for {pricingSuggestion.distance} miles:{" "}
                    <strong>${priceCapWarning.local}</strong> — keeping prices at or below this helps ensure ride-sharing stays cost-sharing, not commercial.
                  </span>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                className="mt-2 h-12 px-5 text-base rounded-lg border-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => {
                  if (rideData.rider_preference === 'both_fine') {
                    handleInputChange('price_per_seat_local', pricingSuggestion.local);
                    handleInputChange('price_per_seat_tourist', pricingSuggestion.visitor);
                  } else {
                    handleInputChange('price_per_seat', pricingSuggestion.local);
                  }
                }}
              >
                use suggested price
              </Button>
            </div>
          )}

          {rideData.rider_preference === 'both_fine' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="priceLocal" className={flowLabel}>price request for locals ($) — enter 0 for free</Label>
                <Input
                  id="priceLocal"
                  type="number"
                  min="0"
                  step="1"
                  value={rideData.price_per_seat_local}
                  onChange={(e) => handleInputChange('price_per_seat_local', e.target.value)}
                  required
                  className={`${flowField} ${priceCapWarning && parseFloat(rideData.price_per_seat_local) > priceCapWarning.local ? 'border-red-400' : ''}`}
                />
                {priceCapWarning && parseFloat(rideData.price_per_seat_local) > priceCapWarning.local && (
                  <p className="text-red-500 text-base flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> exceeds cap of ${priceCapWarning.local}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceTourist" className={flowLabel}>price request for tourists ($) — enter 0 for free</Label>
                <Input
                  id="priceTourist"
                  type="number"
                  min="0"
                  step="1"
                  value={rideData.price_per_seat_tourist}
                  onChange={(e) => handleInputChange('price_per_seat_tourist', e.target.value)}
                  required
                  className={`${flowField} ${priceCapWarning && parseFloat(rideData.price_per_seat_tourist) > priceCapWarning.visitor ? 'border-red-400' : ''}`}
                />
                {priceCapWarning && parseFloat(rideData.price_per_seat_tourist) > priceCapWarning.visitor && (
                  <p className="text-red-500 text-base flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> exceeds cap of ${priceCapWarning.visitor}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="price" className={flowLabel}>price request per seat ($) — enter 0 for free</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1"
                value={rideData.price_per_seat}
                onChange={(e) => handleInputChange('price_per_seat', e.target.value)}
                required
                className={`${flowField} ${priceCapWarning && parseFloat(rideData.price_per_seat) > priceCapWarning.local ? 'border-red-400' : ''}`}
              />
              {priceCapWarning && parseFloat(rideData.price_per_seat) > priceCapWarning.local && (
                <p className="text-red-500 text-base flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> exceeds cap of ${priceCapWarning.local}</p>
              )}
            </div>
          )}
        </section>
      </form>

      {postedRide && (
        <Card className="border-green-300 bg-green-50 rounded-3xl shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-2xl">
                <MapPin className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="font-bold text-green-800 text-lg">ride posted! 🎉</p>
                <p className="text-sm text-green-700">{postedRide.departure_location} → {postedRide.destination}</p>
              </div>
            </div>
            <p className="text-green-800 font-medium">want to also post your return route?</p>
            <p className="text-sm text-green-700">
              need to edit?{" "}
              <Link to="/confirmedrides" className="font-semibold underline underline-offset-2 hover:text-green-900">press here →</Link>
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                className="flex-1 bg-green-600 hover:bg-green-700 rounded-2xl"
                onClick={() => {
                  setRideData(prev => ({
                    ...prev,
                    departure_location: postedRide.destination,
                    destination: postedRide.departure_location,
                    departure_date: '',
                    departure_time: '',
                  }));
                  setStops(['']);
                  const { suggestion, cap } = getPricingInfo(postedRide.destination, postedRide.departure_location);
                  setPricingSuggestion(suggestion);
                  setPriceCapWarning(cap);
                  setPostedRide(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                yes, pre-fill return route
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-2xl border-green-400 text-green-700"
                onClick={() => setPostedRide(null)}
              >
                no thanks
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(() => {
        if (!canPostRide) return null;
        const missing = [];
        if (!rideData.departure_location) missing.push('coming from (starting location)');
        if (!rideData.destination) missing.push('going to (destination)');
        if (!rideData.departure_date) missing.push('departure date');
        if (!rideData.departure_time.replace(/\s*(AM|PM)$/i, '').trim()) missing.push('departure time');
        if (missing.length === 0) return null;
        return (
          <div className="rounded-2xl border-2 border-red-300 bg-red-50 px-4 py-3 flex items-start gap-3">
            <span className="text-lg shrink-0">🚨</span>
            <div>
              <p className="font-bold text-red-700 text-sm">oops! still missing:</p>
              <ul className="mt-1 space-y-0.5">
                {missing.map(f => (
                  <li key={f} className="text-red-600 text-sm">• {f}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      })()}

      <div className="mt-6 pb-8 space-y-4">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !canPostRide || hasUnsupportedLocation}
          className={flowButton}
        >
          {isSubmitting ? 'posting...' : 'post ride'}
        </Button>
        <p className="text-center text-base text-gray-500">
          <Link to="/inbox" className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium">
          edit a pre-existing ride here →
          </Link>
        </p>
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

      <RecurringTripModal
        isOpen={showRecurringTripModal}
        onClose={handleCloseModal}
        onSave={handleSaveTrip}
        editTrip={editingTrip}
      />

      <RiderProfileModal
        isOpen={showRiderProfileModal}
        onClose={() => {
          setShowRiderProfileModal(false);
          setSelectedRiderRequest(null);
        }}
        request={selectedRiderRequest}
        riderRatings={riderRatings}
      />

      <RecurringAutoPostModal
        isOpen={showAutoPostModal}
        onClose={() => {
          setShowAutoPostModal(false);
          setAutoPostTrip(null);
          // Refresh schedules
          if (currentUser) {
            base44.entities.RecurringSchedule.filter({ user_id: currentUser.id })
              .then(setRecurringSchedules).catch(() => {});
          }
        }}
        trip={autoPostTrip}
        existingSchedule={recurringSchedules.find(s => s.recurring_trip_id === autoPostTrip?.id)}
      />

      <ProfileIncompleteModal
        isOpen={showProfileModal}
        missingItems={missingProfileItems}
        action="post a ride"
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}