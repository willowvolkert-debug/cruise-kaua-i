import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LocationAutocomplete from "../shared/LocationAutocomplete";
import TimeInput from "../shared/TimeInput";
import { flowLabel, flowField, flowTextarea, flowToggleRow, flowButton } from "./flowStyles";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const EMPTY = {
  departure_location: "", destination: "", departure_time: "", weekly_days: [],
  seats_needed: 1, description: "", has_luggage: false, is_flexible: false,
};

// Create or edit a saved recurring ride request.
export default function RecurringRequestModal({ isOpen, onClose, editRequest, user, onSaved, island = "Kauai" }) {
  const [data, setData] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setData(editRequest ? { ...EMPTY, ...editRequest, weekly_days: editRequest.weekly_days || [] } : EMPTY);
  }, [isOpen, editRequest]);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const save = async () => {
    if (!data.departure_location || !data.destination || !data.departure_time || data.weekly_days.length === 0) {
      setError("Please add where from, where to, a time, and at least one day.");
      return;
    }
    setSaving(true);
    const payload = {
      departure_location: data.departure_location,
      destination: data.destination,
      departure_time: data.departure_time,
      weekly_days: data.weekly_days,
      seats_needed: parseInt(data.seats_needed),
      description: data.description,
      has_luggage: data.has_luggage,
      is_flexible: data.is_flexible,
      schedule_type: "weekly",
    };
    const saved = editRequest
      ? await base44.entities.RecurringRideRequest.update(editRequest.id, payload)
      : await base44.entities.RecurringRideRequest.create({
          ...payload,
          user_id: user.id,
          is_active: false,
          stops: [],
          rider_name: user.full_name || user.username || user.email?.split("@")[0] || "Cruise member",
          rider_username: user.username || null,
          rider_profile_picture_url: user.profile_picture_url || null,
          rider_bio: user.bio || null,
          rider_age: user.age || null,
          rider_gender: user.gender || null,
        });
    setSaving(false);
    onSaved({ ...(editRequest || {}), ...payload, ...saved });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-secondary">
            {editRequest ? "edit recurring ride request" : "add recurring ride request"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className={flowLabel}>coming from *</Label>
            <LocationAutocomplete value={data.departure_location} onChange={(v) => set("departure_location", v)} placeholder="e.g., Lihue" island={island} className={flowField} />
          </div>
          <div className="space-y-2">
            <Label className={flowLabel}>going to *</Label>
            <LocationAutocomplete value={data.destination} onChange={(v) => set("destination", v)} placeholder="e.g., Hanalei" island={island} className={flowField} />
          </div>
          <div className="space-y-2">
            <Label className={flowLabel}>departure time *</Label>
            <TimeInput value={data.departure_time} onChange={(v) => set("departure_time", v)} className={`${flowField} w-full`} />
          </div>
          <div className="space-y-2">
            <Label className={flowLabel}>which days? *</Label>
            <div className="grid grid-cols-4 gap-2">
              {DAYS.map((day, idx) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => set("weekly_days", data.weekly_days.includes(idx) ? data.weekly_days.filter((d) => d !== idx) : [...data.weekly_days, idx])}
                  className={`h-14 rounded-lg text-lg font-bold border-2 select-none ${data.weekly_days.includes(idx) ? "bg-secondary text-white border-secondary" : "bg-white text-gray-600 border-gray-300"}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className={flowLabel}>seats needed</Label>
            <Select value={String(data.seats_needed)} onValueChange={(v) => set("seats_needed", parseInt(v))}>
              <SelectTrigger className={flowField}><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 8 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)} className="text-lg py-3">{i + 1} seat{i > 0 ? "s" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={flowLabel}>why do you need this ride?</Label>
            <Textarea value={data.description} onChange={(e) => set("description", e.target.value)} className={flowTextarea} placeholder="e.g., Going to work" />
          </div>
          <div className={flowToggleRow}>
            <Label className={flowLabel}>flexible departure time</Label>
            <Switch checked={data.is_flexible} onCheckedChange={(c) => set("is_flexible", c)} />
          </div>
          <div className={flowToggleRow}>
            <Label className={flowLabel}>do you have luggage?</Label>
            <Switch checked={data.has_luggage} onCheckedChange={(c) => set("has_luggage", c)} />
          </div>
          {error && <p className="text-base text-red-600">{error}</p>}
          <Button type="button" onClick={save} disabled={saving} className={flowButton}>
            {saving ? "saving..." : "save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}