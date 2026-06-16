import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CheckCircle, MapPin, Clock, Calendar, Users, MessageSquare, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BookingSuccess() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get("booking_id");
    if (!bookingId) {
      setLoading(false);
      return;
    }
    loadBookingDetails(bookingId);
  }, []);

  const loadBookingDetails = async (bookingId) => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");
      const paymentType = params.get("payment");

      // For Stripe-paid rides, sync payment via handlePaymentSuccess
      if (sessionId && paymentType !== 'free') {
        try {
          const { handlePaymentSuccess } = await import("@/functions/handlePaymentSuccess");
          await handlePaymentSuccess({ booking_id: bookingId, session_id: sessionId });
        } catch (e) {
          console.error("handlePaymentSuccess error:", e);
        }
      }

      // Poll up to 10 seconds for payment_status to become 'paid'
      // (free rides are already 'paid', so they resolve immediately)
      let b = null;
      for (let i = 0; i < 10; i++) {
        const results = await base44.entities.RideBooking.list();
        b = results.find(r => r.id === bookingId) || null;
        if (b && b.payment_status === "paid") break;
        await new Promise(r => setTimeout(r, 1000));
      }
      if (b) {
        setBooking(b);
        const rides = await base44.entities.Ride.list();
        const foundRide = rides.find(r => r.id === b.ride_id) || null;
        setRide(foundRide);
      }
    } catch (e) {
      console.error("BookingSuccess load error:", e);
    }
    setLoading(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-gray-500 text-lg">Confirming your payment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">

        {/* Success header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          {(() => {
            const isFree = new URLSearchParams(window.location.search).get('payment') === 'free';
            return (
              <>
                <h1 className="text-3xl font-bold text-secondary">{isFree ? "free ride requested! 🤙" : "you're booked! 🤙"}</h1>
                <p className="text-gray-600">{isFree ? "request sent — the driver will review it shortly." : "payment confirmed — the driver will review your request."}</p>
              </>
            );
          })()}
        </div>

        {/* Ride details card */}
        {ride && booking && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-secondary text-lg">ride details</h2>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">{ride.departure_location} → {ride.destination}</p>
                {booking.is_partial_ride && booking.partial_from && booking.partial_to && (
                  <p className="text-sm text-gray-500">partial: {booking.partial_from} → {booking.partial_to}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary shrink-0" />
              <p className="text-gray-800">{formatDate(ride.departure_date)}</p>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary shrink-0" />
              <p className="text-gray-800">{ride.departure_time}</p>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary shrink-0" />
              <p className="text-gray-800">{booking.seats_booked} seat{booking.seats_booked > 1 ? "s" : ""} booked</p>
            </div>

            {ride.driver_name && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">driver</p>
                <p className="font-semibold text-gray-800">
                  {ride.driver_username ? `@${ride.driver_username}` : ride.driver_name}
                </p>
              </div>
            )}
          </div>
        )}

        {/* What's next */}
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 space-y-3">
          <h3 className="font-bold text-blue-900">what's next?</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
              <p>message your driver anytime through the <strong>inbox</strong></p>
            </div>
            <div className="flex items-start gap-2">
              <Settings className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
              <p>view, edit, or cancel your ride on the <strong>confirmed rides</strong> page</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-white text-base font-semibold py-6 rounded-2xl"
          onClick={() => navigate("/confirmedrides")}
        >
          got it — view my confirmed rides
        </Button>
      </div>
    </div>
  );
}