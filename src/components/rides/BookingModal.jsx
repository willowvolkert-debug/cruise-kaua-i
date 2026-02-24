import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { CreditCard, Navigation, Star, Loader2, MessageCircle, Wind, HelpCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createRideCheckout } from "@/functions/createRideCheckout";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function BookingModal({ isOpen, onClose, ride, onConfirmBooking }) {
  const [bookingData, setBookingData] = useState({ 
    seats_booked: 1, 
    description: '', 
    has_luggage: false,
    wants_detour_service: false,
    detour_destination: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [driverRatings, setDriverRatings] = useState([]);
  const [isFirstBooking, setIsFirstBooking] = useState(true);

  useEffect(() => {
    if (isOpen && ride) {
        loadData();
        setBookingData({ 
          seats_booked: 1, 
          description: '', 
          has_luggage: false,
          wants_detour_service: false,
          detour_destination: ''
        });
    }
  }, [isOpen, ride]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Load driver profile and ratings
      if (ride?.driver_id) {
        console.log('Ride data in BookingModal:', ride);
        console.log('Driver profile picture URL:', ride.driver_profile_picture_url);
        
        // Fetch ratings and check if first booking
        const [allRatings, bookings] = await Promise.all([
          base44.entities.Rating.list(),
          base44.entities.RideBooking.list()
        ]);

        const driverRatingsFiltered = allRatings.filter(r => 
          String(r.rated_user_id) === String(ride.driver_id) && r.trip_role === 'driver'
        );
        setDriverRatings(driverRatingsFiltered || []);

        // Check if user has any previous PAID bookings (including completed)
        const hasPreviousBookings = bookings.some(b => 
          String(b.passenger_id) === String(user.id) && 
          (b.payment_status === 'paid' || b.booking_status === 'completed')
        );
        setIsFirstBooking(!hasPreviousBookings);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };
  
  const handleRequestToBook = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!bookingData.description) {
      alert("Please tell the driver why you need a ride.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const detourFee = bookingData.wants_detour_service ? 5 : 0;
      const isLocal = currentUser?.has_hawaii_id === true;
      const pricePerSeat = isLocal ? (ride.price_per_seat_local || 0) : (ride.price_per_seat_tourist || 0);
      const baseAmount = (bookingData.seats_booked || 0) * pricePerSeat;

      // Create checkout session
      const { data } = await createRideCheckout({
        ride_id: ride.id,
        seats_booked: parseInt(bookingData.seats_booked),
        base_amount: baseAmount,
        detour_fee: detourFee,
        description: bookingData.description,
        has_luggage: bookingData.has_luggage,
        wants_detour_service: bookingData.wants_detour_service,
        detour_destination: bookingData.detour_destination,
        driver_id: ride.driver_id,
        driver_username: ride.driver_username || '',
        success_url: window.location.origin + '/trips',
        cancel_url: window.location.origin + '/trips'
      });

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Error creating payment: " + error.message);
      setIsSubmitting(false);
    }
  };

  if (!ride) return null;
  
  const detourFee = bookingData.wants_detour_service ? 5 : 0;
  const isLocal = currentUser?.has_hawaii_id === true;
  const pricePerSeat = isLocal ? (ride.price_per_seat_local || 0) : (ride.price_per_seat_tourist || 0);
  const rideAmount = (bookingData.seats_booked || 0) * pricePerSeat + detourFee;
  const connectFee = rideAmount * 0.10;
  const licenseVerificationFee = isFirstBooking ? 1.50 : 0;
  const subtotal = rideAmount + connectFee + licenseVerificationFee;
  const creditCardFee = subtotal * 0.03;
  const totalAmount = subtotal + creditCardFee;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto !bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary">
            request to book
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Review the driver profile and trip details before booking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleRequestToBook} className="space-y-4 pt-4">
            {/* Driver Profile - Scrollable */}
            {isLoading ? (
              <div className="p-8 text-center">Loading driver information...</div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-4 pr-2">
                {/* Driver Profile Card - Matching Account page exactly */}
                <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-white border border-gray-200 rounded-3xl shadow-sm">
                  <Avatar className="w-20 h-20 text-2xl">
                    <AvatarImage src={ride?.driver_profile_picture_url} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-green-400 text-white font-bold">
                      {ride?.driver_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <h2 className="text-2xl font-bold text-secondary">
                      {ride?.driver_username ? `@${ride.driver_username}` : ride?.driver_name}
                    </h2>
                    {ride?.driver_age && ride?.driver_gender && (
                      <p className="text-sm text-gray-500">{ride.driver_age} years old • {ride.driver_gender}</p>
                    )}
                    {ride?.driver_bio && (
                      <p className="text-gray-600">{ride.driver_bio}</p>
                    )}
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-gray-500"/>
                        <span className="text-sm text-gray-600">chattiness:</span>
                        <Badge variant="outline" className="rounded-2xl border-gray-300">{ride?.driver_preferences_chattiness || 'Flexible'}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="w-4 h-4 text-gray-500"/>
                        <span className="text-sm text-gray-600">scents:</span>
                        <Badge variant="outline" className="rounded-2xl border-gray-300">{ride?.driver_preferences_scents || 'Any'}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold">
                        {driverRatings.length > 0 
                          ? (driverRatings.reduce((sum, r) => sum + r.rating_value, 0) / driverRatings.length).toFixed(1)
                          : 'New'}
                      </span>
                      <span className="text-sm text-gray-400">({driverRatings.length} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                {ride?.car_model && (
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Vehicle:</span> {ride.car_model}
                    </p>
                  </div>
                )}

                {/* Recent Reviews */}
                {driverRatings.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-secondary mb-2">recent reviews</h4>
                    <div className="space-y-2">
                      {driverRatings.slice(0, 2).map(rating => (
                        <div key={rating.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            {Array(rating.rating_value).fill(0).map((_, i) => (
                              <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                            ))}
                            <span className="text-xs text-gray-500">
                              {format(new Date(rating.created_date), "MMM yyyy")}
                            </span>
                          </div>
                          {rating.comment && (
                            <p className="text-sm text-gray-700 italic">"{rating.comment}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="seats">seats required</Label>
                <Select value={bookingData.seats_booked.toString()} onValueChange={(v) => setBookingData(p=>({...p, seats_booked: parseInt(v, 10)}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {Array.from({ length: Math.min(ride.seats_available, 8) }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">why riding *</Label>
                <Textarea 
                  id="description" 
                  value={bookingData.description} 
                  onChange={(e) => setBookingData(p => ({...p, description: e.target.value}))} 
                  placeholder="e.g., heading to the north shore for surfing!" 
                  required
                  className="h-20"
                />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="luggage" 
                checked={bookingData.has_luggage}
                onCheckedChange={(checked) => setBookingData(p => ({...p, has_luggage: checked}))}
              />
              <Label htmlFor="luggage" className="cursor-pointer">
                I have luggage
              </Label>
            </div>

            {ride.offers_detour_service && (
              <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Navigation className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">detour service available</p>
                    <p className="text-sm text-green-700">this driver is willing to drive you to a final destination off the highway for an added fee. would you like this additional service for $5?</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setBookingData(p => ({ ...p, wants_detour_service: true }))}
                    className={`flex-1 ${bookingData.wants_detour_service ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                  >
                    yes
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setBookingData(p => ({ ...p, wants_detour_service: false, detour_destination: '' }))}
                    className={`flex-1 ${!bookingData.wants_detour_service ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                  >
                    no
                  </Button>
                </div>
                {bookingData.wants_detour_service && (
                  <div className="space-y-2">
                    <Label htmlFor="detour-destination">where is your final destination? *</Label>
                    <Textarea
                      id="detour-destination"
                      value={bookingData.detour_destination}
                      onChange={(e) => setBookingData(p => ({ ...p, detour_destination: e.target.value }))}
                      placeholder="e.g., Princeville Resort"
                      required={bookingData.wants_detour_service}
                      className="h-20"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Ride cost:</span>
                <span className="font-medium">${((bookingData.seats_booked || 0) * pricePerSeat).toFixed(2)}</span>
              </div>
              {bookingData.wants_detour_service && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Detour service:</span>
                  <span className="font-medium">${detourFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Connect fee (10%):</span>
                <span className="font-medium">${connectFee.toFixed(2)}</span>
              </div>
              {isFirstBooking && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 flex items-center gap-1">
                    License verification fee:
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="text-gray-400 hover:text-gray-600">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-3 text-sm">
                        <p className="font-semibold mb-1">One-Time Verification Fee</p>
                        <p className="text-gray-600">
                          Stripe charges $1.50 to verify your identity through their secure ID verification system. This is a one-time fee only on your first booking.
                        </p>
                      </PopoverContent>
                    </Popover>
                  </span>
                  <span className="font-medium">${licenseVerificationFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Credit card fee (3%):</span>
                <span className="font-medium">${creditCardFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-semibold text-secondary">Total:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-primary">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                You'll be redirected to Stripe to complete payment securely.
              </p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>cancel</Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    redirecting...
                  </>
                ) : (
                  'book this ride'
                )}
              </Button>
            </DialogFooter>
            </form>
      </DialogContent>
    </Dialog>
  );
}