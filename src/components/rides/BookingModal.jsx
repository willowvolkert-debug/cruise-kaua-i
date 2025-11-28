import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { DollarSign, CreditCard, Plus, Navigation, Star } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BookingModal({ isOpen, onClose, ride, onConfirmBooking }) {
  const [bookingData, setBookingData] = useState({ 
    seats_booked: 1, 
    description: '', 
    has_luggage: false,
    payment_method_id: null,
    wants_detour_service: false,
    detour_destination: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [driverRatings, setDriverRatings] = useState([]);

  useEffect(() => {
    if (isOpen) {
        loadData();
        setBookingData({ 
          seats_booked: 1, 
          description: '', 
          has_luggage: false,
          payment_method_id: null,
          wants_detour_service: false,
          detour_destination: ''
        });
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Load user's payment methods
      const allMethods = await base44.entities.PaymentMethod.list();
      const userMethods = allMethods.filter(pm => pm.user_id === user.id);
      setPaymentMethods(userMethods);

      // Auto-select default payment method
      const defaultMethod = userMethods.find(pm => pm.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod);
        setBookingData(prev => ({ ...prev, payment_method_id: defaultMethod.id }));
      }

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

    if (paymentMethods.length === 0) {
      alert("Please add a payment method in your Account page before booking a ride.");
      return;
    }

    if (!bookingData.payment_method_id) {
      alert("Please select a payment method.");
      return;
    }
    
    setIsSubmitting(true);
    const detourFee = bookingData.wants_detour_service ? 5 : 0;
    const isLocal = currentUser?.has_hawaii_id === true;
    const pricePerSeat = isLocal ? (ride.price_per_seat_local || 0) : (ride.price_per_seat_tourist || 0);
    const baseAmount = (bookingData.seats_booked || 0) * pricePerSeat + detourFee;
    const connectFee = baseAmount * 0.10;
    const totalAmount = baseAmount + connectFee;
    
    const bookingDetails = {
      ...bookingData,
      passenger_name: currentUser.full_name,
      passenger_username: currentUser.username,
      ride_id: ride.id,
      total_amount: totalAmount,
      seats_booked: parseInt(bookingData.seats_booked),
      payment_status: 'pending',
      booking_status: 'pending',
      detour_fee: detourFee
    };
    await onConfirmBooking(bookingDetails);
    setIsSubmitting(false);
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

            <div className="space-y-2">
              <Label>payment method *</Label>
              {paymentMethods.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-3">
                    No payment methods available. Add one to continue.
                  </p>
                  <Link to={createPageUrl("Account")}>
                    <Button type="button" size="sm" variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </Link>
                </div>
              ) : (
                <Select 
                  value={bookingData.payment_method_id || ''} 
                  onValueChange={(v) => {
                    const method = paymentMethods.find(pm => pm.id === v);
                    setSelectedPaymentMethod(method);
                    setBookingData(p => ({...p, payment_method_id: v}));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span>{method.card_brand} •••• {method.card_last4}</span>
                          {method.is_default && <Badge className="text-xs">default</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

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

            <p className="text-sm text-gray-600">
              Payment will be processed automatically when the driver accepts your request.
            </p>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>cancel</Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || paymentMethods.length === 0} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? 'sending request...' : 'request to book'}
              </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}