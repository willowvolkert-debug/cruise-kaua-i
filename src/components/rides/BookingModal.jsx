import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { CreditCard, Navigation, Star, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createRideCheckout } from "@/functions/createRideCheckout";

export default function BookingModal({ isOpen, onClose, ride, onConfirmBooking }) {
  const [bookingData, setBookingData] = useState({ 
    seats_booked: 1, 
    description: '', 
    has_luggage: false,
    wants_detour_service: false,
    detour_destination: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [driverRatings, setDriverRatings] = useState([]);

  useEffect(() => {
    if (isOpen) {
        loadData();
        setBookingData({ 
          seats_booked: 1, 
          description: '', 
          has_luggage: false,
          wants_detour_service: false,
          detour_destination: ''
        });
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Load driver profile and ratings
      if (ride?.driver_id) {
        const allUsers = await base44.entities.User.list();
        const driver = allUsers.find(u => u.id === ride.driver_id);
        setDriverProfile(driver);

        const allRatings = await base44.entities.Rating.list();
        const ratings = allRatings.filter(r => 
          r.rated_user_id === ride.driver_id && r.trip_role === 'driver'
        );
        setDriverRatings(ratings);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
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
        driver_username: driverProfile?.username || '',
        success_url: window.location.origin + window.location.pathname,
        cancel_url: window.location.origin + window.location.pathname
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
  const baseAmount = (bookingData.seats_booked || 0) * pricePerSeat + detourFee;
  const connectFee = baseAmount * 0.10;
  const totalAmount = baseAmount + connectFee;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary">
            request to book
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleRequestToBook} className="space-y-4 pt-4">
            {/* Driver Info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-200">
              <Avatar className="w-12 h-12">
                <AvatarImage src={driverProfile?.profile_picture_url} />
                <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white font-bold">
                  {ride?.driver_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-secondary">{ride?.driver_name}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {driverRatings.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span>
                        {(driverRatings.reduce((sum, r) => sum + r.rating_value, 0) / driverRatings.length).toFixed(1)}
                      </span>
                      <span className="text-gray-400">({driverRatings.length})</span>
                    </div>
                  )}
                  {ride?.car_model && <span>• {ride.car_model}</span>}
                </div>
              </div>
            </div>

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
                    YES
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setBookingData(p => ({ ...p, wants_detour_service: false, detour_destination: '' }))}
                    className={`flex-1 ${!bookingData.wants_detour_service ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                  >
                    NO
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

            <div className="bg-yellow-50 rounded-lg p-4 space-y-2">
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
              <div className="border-t border-yellow-200 pt-2 flex justify-between">
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
                  'proceed to payment'
                )}
              </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}