import React, { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function RejectionAlert({ rejectedBookings, onDismiss }) {
  const [dismissingIds, setDismissingIds] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);

  const visibleBookings = rejectedBookings?.filter(b => !dismissedIds.includes(b.id)) || [];

  if (visibleBookings.length === 0) return null;

  const handleDismiss = async (bookingId) => {
    setDismissingIds(prev => [...prev, bookingId]);
    try {
      // Mark the booking as dismissed so it won't show again
      await base44.entities.RideBooking.update(bookingId, {
        booking_status: 'cancelled'
      });
      // Hide immediately in local state
      setDismissedIds(prev => [...prev, bookingId]);
      onDismiss(bookingId);
    } catch (error) {
      console.error("Error dismissing rejection:", error);
      setDismissingIds(prev => prev.filter(id => id !== bookingId));
    }
  };

  return (
    <>
      {visibleBookings.map(booking => (
        <Alert key={booking.id} className="bg-red-50 border-red-300 rounded-3xl">
          <XCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="font-bold text-red-800">your ride request has been rejected</AlertTitle>
          <AlertDescription className="text-red-700">
            <p className="mb-3">
              The driver was unable to accept your request at this time. 
              Your payment will be refunded automatically.
            </p>
            <Button
              onClick={() => handleDismiss(booking.id)}
              disabled={dismissingIds.includes(booking.id)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-2xl"
            >
              {dismissingIds.includes(booking.id) ? 'dismissing...' : 'got it'}
            </Button>
          </AlertDescription>
        </Alert>
      ))}
    </>
  );
}