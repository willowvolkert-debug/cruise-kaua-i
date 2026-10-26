import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { HAZARD_TYPES } from "./hazardTypes";

const geocode = async (q) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&bounded=1&viewbox=-159.85,22.25,-159.25,21.85&q=${encodeURIComponent(q + ", Kauai, Hawaii")}`;
  const res = await fetch(url);
  const data = await res.json();
  return data[0] ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
};

export default function ReportDialog({ open, onOpenChange, user, picked, onCreated }) {
  const [type, setType] = useState(null);
  const [note, setNote] = useState("");
  const [place, setPlace] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    let pos = picked;
    if (!pos && place.trim()) {
      pos = await geocode(place.trim()).catch(() => null);
    }
    if (!pos) {
      setSaving(false);
      toast.error("Couldn't find that place. Try a nearby town or road name, or tap the map to drop a pin.");
      return;
    }
    const report = await base44.entities.RoadReport.create({
      type,
      note: note.trim() || undefined,
      place: place.trim() || undefined,
      lat: pos[0],
      lng: pos[1],
      reporter_id: user.id,
      reporter_name: user.full_name || "neighbor",
      confirmed_by: [user.id],
      gone_by: [],
      status: "active",
    });
    setSaving(false);
    setType(null);
    setNote("");
    setPlace("");
    onOpenChange(false);
    toast.success("Thanks! Your report is on the map.");
    onCreated(report);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="cruise-head text-3xl text-secondary">what's happening?</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2">
          {HAZARD_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 text-center select-none transition-all ${
                type === t.key ? "border-primary bg-primary/10" : "border-border bg-background"
              }`}
            >
              <span className="text-2xl">{t.emoji}</span>
              <span className="text-[11px] leading-tight font-semibold text-foreground">{t.label}</span>
            </button>
          ))}
        </div>
        <Input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="where? e.g. Kuhio Hwy near Kapaʻa"
        />
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="add a quick note (optional), e.g. right lane blocked near Kapaʻa"
          rows={2}
        />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {picked ? "Using the pin you dropped on the map." : "Type where it is. We never use your real location."}
        </p>
        <Button onClick={submit} disabled={!type || saving || (!picked && !place.trim())} className="w-full rounded-full select-none">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "post report"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}