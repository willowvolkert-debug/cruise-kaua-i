import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { confirmRecurringRide } from "@/functions/confirmRecurringRide";

export default function ConfirmRidePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending"); // pending | confirming | confirmed | error
  const [scheduleId, setScheduleId] = useState(null);
  const [date, setDate] = useState(null);
  const [tripName, setTripName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("schedule_id");
    const d = params.get("date");
    const name = params.get("trip_name");

    if (!sid || !d) {
      setStatus("error");
      return;
    }

    setScheduleId(sid);
    setDate(d);
    if (name) setTripName(decodeURIComponent(name));

    // Auto-confirm immediately on page load
    setStatus("confirming");
    confirmRecurringRide({ schedule_id: sid, date: d }).then(res => {
      if (res.data?.success) {
        if (res.data.trip_name) setTripName(res.data.trip_name);
        setStatus("confirmed");
      } else {
        setStatus("error");
      }
    }).catch(() => setStatus("error"));
  }, []);

  const handleConfirm = async () => {
    setStatus("confirming");
    try {
      const res = await confirmRecurringRide({ schedule_id: scheduleId, date });
      if (res.data?.success) {
        if (res.data.trip_name) setTripName(res.data.trip_name);
        setStatus("confirmed");
      } else {
        setStatus("error");
      }
    } catch (e) {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-6 max-w-md w-full text-center space-y-5">
        <img
          src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
          alt="Cruise Kauaʻi"
          className="w-16 h-16 rounded-2xl mx-auto"
        />

        {status === "pending" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-secondary">confirm your ride</h1>
            <p className="text-gray-600">
              please confirm you'll be making the{tripName ? <> <strong>{tripName}</strong></> : ""} trip on <strong>{date}</strong>.
            </p>
            <p className="text-sm text-gray-500">
              if you don't confirm, this ride will not be posted.
            </p>
            <Button onClick={handleConfirm} className="w-full rounded-2xl bg-primary text-lg py-5">
              yes, i'll be making this trip ✓
            </Button>
            <button
              onClick={() => navigate(createPageUrl("Trips"))}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              i won't be making this trip
            </button>
          </div>
        )}

        {status === "confirming" && (
          <div className="space-y-3">
            <Loader className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-gray-500">confirming...</p>
          </div>
        )}

        {status === "confirmed" && (
          <div className="space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-secondary">ride confirmed!</h1>
            <p className="text-gray-600">
              your {tripName && <strong>{tripName}</strong>} ride on <strong>{date}</strong> is confirmed. mahalo!
            </p>
            <Button onClick={() => navigate(createPageUrl("Trips"))} className="w-full rounded-2xl bg-primary">
              back to trips
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h1 className="text-2xl font-bold text-secondary">something went wrong</h1>
            <p className="text-gray-500 text-sm">this confirmation link may be invalid or expired.</p>
            <Button onClick={() => navigate(createPageUrl("Trips"))} variant="outline" className="w-full rounded-2xl">
              back to trips
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}