import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Car, ChevronDown, ChevronUp, RefreshCw, AlertTriangle } from "lucide-react";
import { formatHST } from "@/lib/formatHST";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  paid: "bg-emerald-100 text-emerald-800 border-emerald-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  completed: "bg-blue-100 text-blue-800 border-blue-300",
  cancelled: "bg-gray-100 text-gray-600 border-gray-300",
  rejected: "bg-red-100 text-red-700 border-red-300",
};

function BookingRow({ booking }) {
  const [expanded, setExpanded] = useState(false);
  const isFailed = booking.payment_status === "failed";

  return (
    <div className={`border rounded-2xl overflow-hidden ${isFailed ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"}`}>
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <span className="font-semibold text-secondary text-sm">{booking.passenger_name}</span>
              <span className="text-gray-400 mx-2">→</span>
              <span className="font-semibold text-secondary text-sm">@{booking.driver_username || "driver"}</span>
            </div>
            <Badge variant="outline" className={`text-xs ${STATUS_COLORS[booking.booking_status] || "bg-gray-100 text-gray-600"}`}>
              {booking.booking_status}
            </Badge>
            {booking.payment_status === "paid" && (
              <Badge className="bg-emerald-100 text-emerald-700 text-xs border border-emerald-300">💳 paid</Badge>
            )}
            {isFailed && (
              <Badge className="bg-red-600 text-white text-xs flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                payment failed
              </Badge>
            )}
            {booking.messages?.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MessageSquare className="w-3 h-3" />
                {booking.messages.length} msg{booking.messages.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{formatHST(booking.created_date, "MMM d, h:mm a")} HST</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">booking ID: {booking.id?.substring(0, 12)}…</p>
      </button>

      {/* Expanded message thread */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600 mb-2">
            <span><strong>seats:</strong> {booking.seats_booked}</span>
            <span><strong>amount:</strong> ${booking.total_amount?.toFixed(2)}</span>
            <span><strong>payment:</strong> {booking.payment_status}</span>
            <span><strong>has luggage:</strong> {booking.has_luggage ? "yes" : "no"}</span>
          </div>

          {isFailed && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-sm text-red-800 mb-2">
              <p className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Payment blocked/failed</p>
              {booking.payment_failure_reason && (
                <p className="text-xs mt-1 text-red-700">Reason: {booking.payment_failure_reason}</p>
              )}
              <p className="text-xs mt-1 text-red-600">Rider needs to submit a new booking request.</p>
            </div>
          )}
          {booking.messages && booking.messages.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">message thread</p>
              {booking.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl text-sm border ${
                    msg.sender_id === booking.passenger_id
                      ? "bg-blue-50 border-blue-100 ml-4"
                      : "bg-gray-50 border-gray-100 mr-4"
                  }`}
                >
                  <p className="text-xs font-semibold text-secondary mb-1">
                    @{msg.sender_name}
                    {msg.sender_id === booking.passenger_id ? " (rider)" : " (driver)"}
                    {" · "}
                    {msg.timestamp ? formatHST(msg.timestamp, "MMM d, h:mm a") + " HST" : ""}
                  </p>
                  <p className="text-gray-800 whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">no messages yet — booking only</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function BookingsMonitor() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [expanded, setExpanded] = useState(false);

  const load = () => {
    setIsLoading(true);
    base44.entities.RideBooking.list("-created_date", 200)
      .then(data => { setBookings(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);



  const filtered = filter === "all" ? bookings
    : filter === "failed" ? bookings.filter(b => b.payment_status === "failed")
    : filter === "paid" ? bookings.filter(b => b.payment_status === "paid" && b.booking_status === "pending")
    : bookings.filter(b => b.booking_status === filter);

  const counts = {
    all: bookings.length,
    failed: bookings.filter(b => b.payment_status === "failed").length,
    pending: bookings.filter(b => b.booking_status === "pending" && b.payment_status !== "paid" && b.payment_status !== "failed").length,
    paid: bookings.filter(b => b.payment_status === "paid" && b.booking_status === "pending").length,
    confirmed: bookings.filter(b => b.booking_status === "confirmed").length,
    completed: bookings.filter(b => b.booking_status === "completed").length,
    cancelled: bookings.filter(b => b.booking_status === "cancelled").length,
  };

  return (
    <Card className="shadow-lg rounded-3xl border-gray-200 bg-white">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="text-xl flex items-center justify-between text-secondary">
          <div className="flex items-center gap-2">
            <Car className="w-6 h-6 text-primary" />
            bookings & communications
            <Badge className="bg-primary text-white text-xs">{bookings.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); load(); }}
              className="rounded-xl h-8 w-8"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="p-4 space-y-4">
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {["all", "failed", "pending", "paid", "confirmed", "completed", "cancelled"].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  filter === s
                    ? s === "failed" ? "bg-red-600 text-white border-red-600" : "bg-primary text-white border-primary"
                    : s === "failed" && counts.failed > 0 ? "bg-red-50 text-red-700 border-red-400 hover:border-red-600" : "bg-white text-gray-600 border-gray-300 hover:border-primary"
                }`}
              >
                {s === "failed" && counts.failed > 0 ? "⚠ " : ""}{s} ({counts[s] ?? 0})
              </button>
            ))}
          </div>

          {isLoading ? (
            <p className="text-center text-gray-400 text-sm py-6">loading bookings...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">no bookings found</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filtered.map(b => <BookingRow key={b.id} booking={b} />)}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}