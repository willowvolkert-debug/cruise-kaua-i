import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { DollarSign, CreditCard, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BookingModal({ isOpen, onClose, ride, onConfirmBooking }) {
  const [bookingData, setBookingData] = useState({ 
    seats_booked: 1, 
    description: '', 
    has_luggage: false,
    payment_method_id: null 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  useEffect(() => {
    if (isOpen) {
        loadData();
        setBookingData({ 
          seats_booked: 1, 
          description: '', 
          has_luggage: false,
          payment_method_id: null 
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
    const bookingDetails = {
      ...bookingData,
      passenger_name: currentUser.full_name,
      passenger_username: currentUser.username,
      ride_id: ride.id,
      total_amount: (bookingData.seats_booked || 0) * (ride?.price_per_seat || 0),
      seats_booked: parseInt(bookingData.seats_booked),
      payment_status: 'pending',
      booking_status: 'pending',
    };
    await onConfirmBooking(bookingDetails);
    setIsSubmitting(false);
  };

  if (!ride) return null;
  
  const baseAmount = (bookingData.seats_booked || 0) * (ride?.price_per_seat || 0);
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
                <span className="font-medium">${baseAmount.toFixed(2)}</span>
              </div>
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