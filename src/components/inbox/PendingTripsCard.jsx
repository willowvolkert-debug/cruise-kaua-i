import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Calendar, MessageSquare, X, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

// Helper to convert 24-hour time to 12-hour format with AM/PM
const formatTime12Hour = (timeStr) => {
    if (!timeStr) return '';
    if (/AM|PM/i.test(timeStr)) return timeStr;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export default function PendingTripsCard({ 
  pendingBookings = [], 
  allRidesData = [], 
  getUserById, 
  onCancelRequest, 
  onMessageDriver,
  onPayDifference
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayDifference = async (booking) => {
    if (!onPayDifference) return;
    setIsProcessing(true);
    try {
      await onPayDifference(booking);
    } finally {
      setIsProcessing(false);
    }
  };

  if (pendingBookings.length === 0) return null;

  return (
    <Card className="shadow-lg border-yellow-200 bg-yellow-50 rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-secondary">
          <Clock className="w-6 h-6 text-yellow-600"/>
          pending trips ({pendingBookings.length})
        </CardTitle>
        <p className="text-sm text-yellow-700">Waiting for drivers to accept your request</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingBookings.map(booking => {
          const ride = allRidesData.find(r => r.id === booking.ride_id) || {};
          const driverUser = getUserById(booking.driver_id);
          const driverUsername = driverUser?.username || booking.driver_username || 'Driver';
          
          return (
            <div key={booking.id} className="p-4 bg-white rounded-2xl border border-yellow-200">
              <div className="space-y-3">
                {/* Ride Details */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{ride.departure_date ? format(new Date(ride.departure_date), "EEE, MMM d, yyyy") : 'TBD'}</span>
                  {ride.departure_time && (
                    <>
                      <Clock className="w-4 h-4 ml-2" />
                      <span>{formatTime12Hour(ride.departure_time)}</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-secondary">
                    {ride.departure_location || 'Loading...'} → {ride.destination || 'Loading...'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600">
                  Driver: @{driverUsername} • {booking.seats_booked} seat(s) • ${booking.total_amount?.toFixed(2)}
                </p>
                
                {/* Status Badge */}
                {booking.price_offer_status === 'driver_requesting_full' ? (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-300 rounded-2xl">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Driver wants full price: ${ride.price_per_seat?.toFixed(2)}/seat
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 rounded-2xl">
                    <Clock className="w-3 h-3 mr-1" />
                    Awaiting driver approval
                  </Badge>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {booking.price_offer_status === 'driver_requesting_full' ? (
                    <>
                      <Button
                        onClick={() => handlePayDifference(booking)}
                        disabled={isProcessing}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl"
                        size="sm"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {isProcessing ? 'Processing...' : `Pay Difference (${((ride.price_per_seat - (booking.offered_price || 0)) * booking.seats_booked).toFixed(2)})`}
                      </Button>
                      <Button
                        onClick={() => onCancelRequest(booking)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50 rounded-2xl"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel & Refund
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => onMessageDriver(booking, driverUsername, driverUser?.profile_picture_url)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50 rounded-2xl"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message Driver
                      </Button>
                      <Button
                        onClick={() => onCancelRequest(booking)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50 rounded-2xl"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel Request
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}