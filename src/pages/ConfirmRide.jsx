import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ConfirmRidePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | confirming | confirmed | error
  const [scheduleId, setScheduleId] = useState(null);
  const [date, setDate] = useState(null);
  const [tripName, setTripName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("schedule_id");
    const d = params.get("date");

    if (!sid || !d) {
      setStatus("error");
      return;
    }

    setScheduleId(sid);
    setDate(d);
    loadSchedule(sid, d);
  }, []);

  const loadSchedule = async (sid, d) => {
    try {
      const schedules = await base44.entities.RecurringSchedule.list();
      const schedule = schedules.find(s => s.id === sid);
      if (!schedule) {
        setStatus("error");
        return;
      }
      setTripName(schedule.trip_name);

      // Check if already confirmed
      if ((schedule.confirmed_dates || []).includes(d)) {
        setStatus("confirmed");
        return;
      }

      setStatus("pending");
    } catch (e) {
      setStatus("error");
    }
  };

  const handleConfirm = async () => {
    setStatus("confirming");
    try {
      const schedules = await base44.entities.RecurringSchedule.list();
      const schedule = schedules.find(s => s.id === scheduleId);
      if (!schedule) throw new Error("Schedule not found");

      const confirmedDates = [...(schedule.confirmed_dates || []), date];
      await base44.entities.RecurringSchedule.update(scheduleId, { confirmed_dates: confirmedDates });
      setStatus("confirmed");
    } catch (e) {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
        <img
          src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg"
          alt="Cruise Kauaʻi"
          className="w-16 h-16 rounded-2xl mx-auto"
        />

        {status === "loading" && (
          <div className="space-y-3">
            <Loader className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-gray-500">loading...</p>
          </div>
        )}

        {status === "pending" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-secondary">confirm your ride</h1>
            <p className="text-gray-600">
              please confirm you'll be making the <strong>{tripName}</strong> trip on <strong>{date}</strong>.
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
              your <strong>{tripName}</strong> ride on <strong>{date}</strong> will be auto-posted. mahalo!
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