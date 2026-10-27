import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { CreditCard, Navigation, Star, Loader2, MessageCircle, Wind, MapPin, ShieldAlert, HeartHandshake, Info, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createRideCheckout } from "@/functions/createRideCheckout";
import { sendSmsNotification } from "@/functions/sendSmsNotification";
import { format } from "date-fns";
import { suggestPrice } from "@/components/trips/pricingUtils";
import { flowHeading, flowLabel, flowHint, flowField, flowTextarea, flowToggleRow, flowButton } from "@/components/trips/flowStyles";
import { toast } from "@/components/ui/use-toast";

export default function BookingModal({ isOpen, onClose, ride, onConfirmBooking }) {
  const [bookingData, setBookingData] = useState({ 
    seats_booked: 1, 
    description: '', 
    has_luggage: false,
    is_partial_ride: false,
    partial_from: '',
    partial_to: '',
    is_price_offer: false,
    offered_price: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [driverRatings, setDriverRatings] = useState([]);
  const [offerError, setOfferError] = useState('');
  const [isFirstBooking, setIsFirstBooking] = useState(false);
  const [driverCompletedRides, setDriverCompletedRides] = useState(0);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && ride) {
        loadData();
        setBookingData({ 
          seats_booked: 1, 
          description: '', 
          has_luggage: false,
          is_partial_ride: false,
          partial_from: '',
          partial_to: '',
          is_price_offer: false,
          offered_price: ''
        });
        setOfferError('');
        // Scroll to top on re-open
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = 0;
        }, 50);
    }
  }, [isOpen, ride]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      if (ride?.driver_id) {
        const driverRatings = await base44.entities.Rating.filter({
          rated_user_id: ride.driver_id,
          trip_role: 'driver'
        });
        setDriverRatings(driverRatings || []);

        // Fetch completed ride count for the driver
        try {
          const completedCount = await base44.entities.Ride.count({
            driver_id: ride.driver_id,
            status: 'completed'
          });
          setDriverCompletedRides(completedCount);
        } catch (e) { /* non-critical */ }
      }

      // Check if this is the user's first paid booking (to show the $1.50 license verification fee)
      const myBookings = await base44.entities.RideBooking.filter({
        passenger_id: user.id,
        payment_status: 'paid'
      });
      setIsFirstBooking(!myBookings || myBookings.length === 0);
    } catch (error) {
      // silently handle
    }
    setIsLoading(false);
  };
  
  const handleRequestToBook = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!bookingData.description) {
      toast({ variant: "destructive", title: "tell the driver why you need a ride", description: "a short reason is required so the driver knows who's joining.", duration: 4000 });
      return;
    }

    const offerVal = bookingData.is_price_offer ? parseFloat(bookingData.offered_price) : null;
    if (bookingData.is_price_offer) {
      if (!bookingData.offered_price || isNaN(offerVal) || offerVal < 0) {
        setOfferError('Offer must be at least $0.');
        return;
      }
      if (offerVal > 30) {
        setOfferError('Offer cannot exceed $30 per seat.');
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // Prevent duplicate bookings: if the user already has a pending/confirmed
      // booking for this ride, block the new attempt instead of creating a
      // second booking (which happened when a Stripe payment failed and was
      // retried — the retry created a duplicate booking).
      const existing = await base44.entities.RideBooking.filter({
        ride_id: ride.id,
        passenger_id: currentUser.id,
        booking_status: { $in: ['pending', 'confirmed'] }
      });
      if (existing && existing.length > 0) {
        toast({ title: "you already have a booking for this ride ✓", description: "check your inbox for the status.", duration: 4000 });
        setIsSubmitting(false);
        return;
      }

            const isLocal = currentUser?.has_hawaii_id === true;
      // Distinguish "price not set" (null) from "free ride" (explicit 0).
      // Falling back with || 0 treats a missing price as $0, which incorrectly
      // triggers the free-ride path for rides where the driver never set a
      // local/tourist price but did set the generic price_per_seat.
      const localPrice = ride.price_per_seat_local != null ? ride.price_per_seat_local : ride.price_per_seat;
      const touristPrice = ride.price_per_seat_tourist != null ? ride.price_per_seat_tourist : ride.price_per_seat;
      const fullPricePerSeatSubmit = isLocal ? (localPrice ?? 0) : (touristPrice ?? 0);
      let submitPricePerSeat = bookingData.is_price_offer && bookingData.offered_price !== ''
        ? parseFloat(bookingData.offered_price)
        : fullPricePerSeatSubmit;
      if (!bookingData.is_price_offer && bookingData.is_partial_ride && bookingData.partial_from && bookingData.partial_to) {
        const fullRouteSuggestion = suggestPrice(ride.departure_location, ride.destination);
        const partialRouteSuggestion = suggestPrice(bookingData.partial_from, bookingData.partial_to);
        if (fullRouteSuggestion && partialRouteSuggestion && fullRouteSuggestion.distance > 0) {
          const ratio = partialRouteSuggestion.distance / fullRouteSuggestion.distance;
          submitPricePerSeat = Math.max(3, Math.round(fullPricePerSeatSubmit * ratio));
        }
      }
      const baseAmount = (bookingData.seats_booked || 0) * submitPricePerSeat;

      // FREE RIDE ($0 total): skip Stripe, create booking directly
      // Covers both explicit $0 price offers and rides where the driver set price to $0
      if (baseAmount === 0) {
        const booking = await base44.entities.RideBooking.create({
          ride_id: ride.id,
          driver_id: ride.driver_id,
          passenger_id: currentUser.id,
          passenger_name: currentUser.full_name,
          passenger_username: currentUser.username || '',
          driver_username: ride.driver_username || '',
          seats_booked: parseInt(bookingData.seats_booked),
          total_amount: 0,
          booking_status: 'pending',
          payment_status: 'paid',
          description: bookingData.description,
          has_luggage: bookingData.has_luggage,
          is_partial_ride: bookingData.is_partial_ride,
          partial_from: bookingData.partial_from || '',
          partial_to: bookingData.partial_to || '',
          is_price_offer: bookingData.is_price_offer || false,
          offered_price: bookingData.is_price_offer ? 0 : null,
          price_offer_status: bookingData.is_price_offer ? 'pending' : null,
          messages: [{
            sender_id: currentUser.id,
            sender_name: currentUser.full_name,
            message: bookingData.description,
            timestamp: new Date().toISOString()
          }],
          initial_notification_sent: true,
          passenger_profile_picture_url: currentUser.profile_picture_url || null,
          passenger_bio: currentUser.bio || null,
          passenger_age: currentUser.age || null,
          passenger_gender: currentUser.gender || null,
          passenger_preferences_chattiness: currentUser.preferences_chattiness || null,
          passenger_preferences_scents: currentUser.preferences_scents || null,
          license_pending: !currentUser.drivers_license_verified,
        });

        // Send SMS to driver
        try {
          await sendSmsNotification({
            userId: ride.driver_id,
            message: `Cruise Hawaiʻi: ${currentUser.full_name} ${bookingData.is_price_offer ? 'requested a free ride' : 'booked your free ride'}! "${bookingData.description}" Log in to accept or decline: https://cruisekauai.org`
          });
        } catch (smsErr) {
          console.error("SMS error:", smsErr);
        }

        window.location.href = `${window.location.origin}/bookingsuccess?booking_id=${booking.id}&payment=free`;
        return;
      }

      // Paid ride — create Stripe checkout session
      const { data } = await createRideCheckout({
        ride_id: ride.id,
        seats_booked: parseInt(bookingData.seats_booked),
        base_amount: baseAmount,
        description: bookingData.description,
        has_luggage: bookingData.has_luggage,
        is_partial_ride: bookingData.is_partial_ride,
        partial_from: bookingData.partial_from,
        partial_to: bookingData.partial_to,
        is_price_offer: bookingData.is_price_offer || false,
        offered_price: bookingData.is_price_offer ? parseFloat(bookingData.offered_price) : null,
        driver_id: ride.driver_id,
        driver_username: ride.driver_username || '',
        success_url: window.location.origin + '/bookingsuccess',
        cancel_url: window.location.origin + '/trips'
      });

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast({ variant: "destructive", title: "couldn't process payment", description: error.message || "please try again.", duration: 5000 });
      setIsSubmitting(false);
    }
  };

  if (!ride) return null;
  
    const isLocal = currentUser?.has_hawaii_id === true;
  // Same null-vs-zero fix as the submit path — see handleRequestToBook for details.
  const localPriceDisplay = ride.price_per_seat_local != null ? ride.price_per_seat_local : ride.price_per_seat;
  const touristPriceDisplay = ride.price_per_seat_tourist != null ? ride.price_per_seat_tourist : ride.price_per_seat;
  const fullPricePerSeat = isLocal ? (localPriceDisplay ?? 0) : (touristPriceDisplay ?? 0);
  const effectivePricePerSeat = bookingData.is_price_offer && bookingData.offered_price !== '' ? parseFloat(bookingData.offered_price) : fullPricePerSeat;

  // Calculate partial ride price ratio based on distance
  let pricePerSeat = effectivePricePerSeat;
  if (bookingData.is_partial_ride && bookingData.partial_from && bookingData.partial_to) {
    const fullRouteSuggestion = suggestPrice(ride.departure_location, ride.destination);
    const partialRouteSuggestion = suggestPrice(bookingData.partial_from, bookingData.partial_to);
    if (fullRouteSuggestion && partialRouteSuggestion && fullRouteSuggestion.distance > 0) {
      const ratio = partialRouteSuggestion.distance / fullRouteSuggestion.distance;
      pricePerSeat = Math.max(3, Math.round(fullPricePerSeat * ratio));
    }
  }

  const rideAmount = (bookingData.seats_booked || 0) * pricePerSeat;
  const isFreeRide = rideAmount === 0;
  const connectFeeRate = ride?.driver_license_state === 'HI' ? 0.10 : 0.30;
  // Free rides skip Stripe entirely — no connect fee, license fee, SMS fee, or card fee.
  const connectFee = isFreeRide ? 0 : rideAmount * connectFeeRate;
  const licenseVerificationFee = (isFirstBooking && !isFreeRide) ? 1.50 : 0;
  const smsFee = (currentUser?.sms_notifications_enabled && !isFreeRide) ? 0.50 : 0;
  const subtotal = rideAmount + connectFee + licenseVerificationFee + smsFee;
  const creditCardFee = isFreeRide ? 0 : subtotal * 0.03;
  const totalAmount = isFreeRide ? 0 : subtotal + creditCardFee;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent ref={scrollRef} className="sm:max-w-lg max-h-[90vh] overflow-y-auto !bg-white !rounded-lg">
        <DialogHeader>
          <DialogTitle className="cruise-head text-4xl text-secondary leading-none">
            request to book
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-900">
            Review the driver profile and trip details before booking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleRequestToBook} className="space-y-6 pt-2">
            {/* Driver Profile - Full expanded, no inner scroll */}
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading driver information...</div>
            ) : (
              <div className="space-y-4">
                {/* Driver Profile Card */}
                <div className="pb-5 border-b-2 border-gray-200">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-20 h-20 shrink-0 rounded-lg">
                      <AvatarImage src={ride?.driver_profile_picture_url} className="object-cover object-top" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-green-400 text-white font-bold text-xl rounded-lg">
                        {ride?.driver_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <h2 className="text-2xl font-bold text-secondary">
                        {ride?.driver_username ? `@${ride.driver_username}` : ride?.driver_name}
                      </h2>
                      {ride?.driver_age && ride?.driver_gender && (
                        <p className="text-sm text-gray-500">{ride.driver_age} yrs old • {ride.driver_gender}</p>
                      )}
                      {ride?.driver_bio && (
                        <p className="text-sm text-gray-600 leading-relaxed">{ride.driver_bio}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5 text-gray-400"/>
                          <span className="text-xs text-gray-500">{ride?.driver_preferences_chattiness || 'Flexible'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wind className="w-3.5 h-3.5 text-gray-400"/>
                          <span className="text-xs text-gray-500">{ride?.driver_preferences_scents || 'Any'} scents</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-semibold">
                            {driverRatings.length > 0 
                              ? (driverRatings.reduce((sum, r) => sum + r.rating_value, 0) / driverRatings.length).toFixed(1)
                              : 'New'}
                          </span>
                          <span className="text-xs text-gray-400">({driverRatings.length})</span>
                        </div>
                        {driverCompletedRides > 0 && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-xs font-semibold text-gray-600">{driverCompletedRides} completed ride{driverCompletedRides !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {ride?.car_model && (
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                      🚗 <span className="font-medium">{ride.car_model}</span>
                    </p>
                  )}
                </div>

                {/* Recent Reviews */}
                {driverRatings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className={flowHeading}>recent reviews</h4>
                    {driverRatings.slice(0, 2).map(rating => (
                      <div key={rating.id} className="p-3 rounded-lg border-2 border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          {Array(rating.rating_value).fill(0).map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                          ))}
                          {Array(5 - rating.rating_value).fill(0).map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-gray-300" />
                          ))}
                          <span className="text-xs text-gray-400 ml-1">
                            {format(new Date(rating.created_date), "MMM yyyy")}
                          </span>
                        </div>
                        {rating.comment && (
                          <p className="text-sm text-gray-600 italic">"{rating.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="seats" className={flowLabel}>seats required</Label>
                <Select value={bookingData.seats_booked.toString()} onValueChange={(v) => setBookingData(p=>({...p, seats_booked: parseInt(v, 10)}))}>
                    <SelectTrigger className={flowField}><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {Array.from({ length: Math.min(ride.seats_available, 8) }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description" className={flowLabel}>
                  why riding <span className="text-red-500 font-bold">*</span>
                </Label>
                <Textarea 
                  id="description" 
                  value={bookingData.description} 
                  onChange={(e) => setBookingData(p => ({...p, description: e.target.value}))} 
                  placeholder="e.g., heading to the north shore for surfing!" 
                  className={flowTextarea}
                />
                {!bookingData.description && (
                  <p className={flowHint}>required — helps the driver know who's joining</p>
                )}
            </div>

            {ride.offers_midpoint_pickup && (
              <div className={`${flowToggleRow} flex-col items-stretch`}>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="partial_ride"
                    checked={bookingData.is_partial_ride}
                    onCheckedChange={(checked) => setBookingData(p => ({ ...p, is_partial_ride: checked, partial_from: '', partial_to: '' }))}
                  />
                  <Label htmlFor="partial_ride" className="cursor-pointer text-lg font-bold text-gray-800">
                    are you only looking for a section of this ride, not the whole thing?
                  </Label>
                </div>
                {bookingData.is_partial_ride && (
                  <div className="space-y-3 mt-2">
                    <div className="space-y-1">
                      <Label className="text-sm">coming from</Label>
                      <Input
                        value={bookingData.partial_from}
                        onChange={(e) => setBookingData(p => ({ ...p, partial_from: e.target.value }))}
                        placeholder="e.g., Kapaa"
                        className={flowField}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">going to</Label>
                      <Input
                        value={bookingData.partial_to}
                        onChange={(e) => setBookingData(p => ({ ...p, partial_to: e.target.value }))}
                        placeholder="e.g., Hanalei"
                        className={flowField}
                      />
                    </div>
                    {bookingData.partial_from && bookingData.partial_to && (
                      <div className="flex items-start gap-2 p-3 bg-white border border-blue-300 rounded-2xl">
                        <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-blue-800">
                          driving from <strong>{bookingData.partial_from}</strong> to <strong>{bookingData.partial_to}</strong> with this driver will cost <strong>${(pricePerSeat * (bookingData.seats_booked || 1)).toFixed(2)}</strong> per seat (prorated by distance)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className={`${flowToggleRow} justify-start`}>
              <Checkbox 
                id="luggage" 
                checked={bookingData.has_luggage}
                onCheckedChange={(checked) => setBookingData(p => ({...p, has_luggage: checked}))}
              />
              <Label htmlFor="luggage" className="cursor-pointer text-lg font-bold text-gray-800">
                I have luggage
              </Label>
            </div>

            <div className="space-y-3 pb-5 border-b-2 border-gray-200 [&_.text-sm]:text-base">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">{bookingData.is_price_offer && bookingData.offered_price !== '' ? 'Ride cost (your offer):' : 'Price request:'}</span>
                <span className="font-medium">${((bookingData.seats_booked || 0) * pricePerSeat).toFixed(2)}</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Connect fee ({Math.round(connectFeeRate * 100)}%)</span>
                  <span className="font-medium">${connectFee.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-400 pl-0">Platform fee Cruise Hawaiʻi charges to maintain the app and process payments</p>
              </div>

              {isFirstBooking && (
                <div className="space-y-0.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">License verification fee</span>
                    <span className="font-medium">$1.50</span>
                  </div>
                  <p className="text-xs text-gray-400">One-time fee to cover the cost of verifying your driver's license or ID</p>
                </div>
              )}
              {smsFee > 0 && (
                <div className="space-y-0.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">SMS notification fee</span>
                    <span className="font-medium">$0.50</span>
                  </div>
                  <p className="text-xs text-gray-400">Covers text message notifications for ride updates and booking alerts</p>
                </div>
              )}
              <div className="space-y-0.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Credit card fee (3%)</span>
                  <span className="font-medium">${creditCardFee.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-400">Processing fee charged by Stripe, our payment provider</p>
              </div>
              <div className="border-t-2 border-gray-300 pt-3 flex justify-between items-center">
                <span className="font-bold text-secondary text-base">Total</span>
                <span className="text-2xl font-bold text-primary">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Price offer section */}
            <div className={`rounded-lg border-2 p-5 space-y-3 transition-all ${bookingData.is_price_offer ? 'border-green-500 bg-white' : 'border-gray-300 bg-white'}`}>
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setBookingData(p => ({ ...p, is_price_offer: !p.is_price_offer, offered_price: '' }))}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${bookingData.is_price_offer ? 'border-green-500 bg-green-500' : 'border-gray-400 bg-white'}`}>
                  {bookingData.is_price_offer && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className={`text-lg font-bold ${bookingData.is_price_offer ? 'text-green-800' : 'text-gray-800'}`}>
                  too expensive? pitch an offer you can afford
                </span>
              </div>
              {bookingData.is_price_offer && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-green-800 font-medium">driver asks:</span>
                    <span className="font-bold text-green-900">${fullPricePerSeat}/seat</span>
                    <span className="text-sm text-green-700">→ your offer per seat:</span>
                    <div className="flex-1 min-w-[100px]">
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        step="1"
                        placeholder="$ per seat"
                        value={bookingData.offered_price}
                        onChange={(e) => { setOfferError(''); setBookingData(p => ({ ...p, offered_price: e.target.value })); }}
                        className="h-14 text-lg rounded-lg border-2 border-green-500"
                        onClick={(e) => e.stopPropagation()}
                        style={{ MozAppearance: 'textfield' }}
                      />
                    </div>
                  </div>
                  {offerError && (
                    <p className="text-xs text-red-600 font-medium">{offerError}</p>
                  )}
                  {bookingData.offered_price !== '' && !isNaN(parseFloat(bookingData.offered_price)) && !offerError && (
                    <div className="p-3 bg-white border border-green-300 rounded-xl text-sm text-green-800 space-y-1">
                      {parseFloat(bookingData.offered_price) === 0 ? (
                        <>
                          <p>🤙 This is a <strong>free ride</strong> — no payment needed.</p>
                          <p className="text-green-700">The driver can still <strong>accept</strong> or <strong>reject</strong> your request. If accepted, you'll be connected immediately.</p>
                        </>
                      ) : (
                        <>
                          <p>Mahalo! You will pay <strong>${((bookingData.seats_booked || 1) * parseFloat(bookingData.offered_price)).toFixed(2)}</strong> now in Stripe.</p>
                          <p className="text-green-700">The driver can <strong>accept your offer</strong>, <strong>request the full price</strong>, or <strong>reject your request</strong>. If rejected, your payment is fully refunded. 🤙</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isFreeRide && (
              <div className="flex items-center gap-3 py-2">
                <CreditCard className="w-6 h-6 text-gray-700" />
                <p className="text-base text-gray-700">
                  You'll be redirected to Stripe to complete payment securely.
                </p>
              </div>
            )}
            {isFreeRide && (
              <div className="flex items-center gap-3 py-2">
                <HeartHandshake className="w-6 h-6 text-green-600" />
                <p className="text-base text-green-800">
                  Free ride — no payment or Stripe redirect needed.
                </p>
              </div>
            )}

            <DialogFooter className="pt-2 flex-col gap-2">
              <div className="flex flex-col gap-3 w-full">
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className={flowButton}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      redirecting...
                    </>
                  ) : isFreeRide ? (
                    'request free ride →'
                  ) : bookingData.is_price_offer && bookingData.offered_price !== '' ? (
                    'submit request & payment →'
                  ) : (
                    'book this ride'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={onClose} className="w-full h-14 text-lg font-bold rounded-lg border-2 border-gray-300">cancel</Button>
              </div>
            </DialogFooter>
            </form>
      </DialogContent>
    </Dialog>
  );
}