import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import HazardTypePicker from "./HazardTypePicker";
import { geocode } from "./geocode";

export default function EditReportDialog({ report, open, onOpenChange, onSaved }) {
  const [type, setType] = useState(report.type);
  const [place, setPlace] = useState(report.place || "");
  const [note, setNote] = useState(report.note || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const patch = { type, place: place.trim(), note: note.trim() };
    if (place.trim() && place.trim() !== (report.place || "")) {
      const pos = await geocode(place.trim()).catch(() => null);
      if (!pos) {
        setSaving(false);
        toast.error("Couldn't find that place. Try a nearby town or road name.");
        return;
      }
      patch.lat = pos[0];
      patch.lng = pos[1];
    }
    const updated = await base44.entities.RoadReport.update(report.id, patch).catch(() => null);
    setSaving(false);
    if (!updated) {
      toast.error("That alert was already removed.");
      onOpenChange(false);
      return;
    }
    toast.success("Alert updated.");
    onOpenChange(false);
    onSaved({ ...report, ...patch, ...updated });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="cruise-head text-3xl text-secondary">edit alert</DialogTitle>
        </DialogHeader>
        <HazardTypePicker value={type} onChange={setType} />
        <Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="where? e.g. Kuhio Hwy near Kapaʻa" />
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="add a quick note (optional)" rows={2} />
        <Button onClick={save} disabled={saving} className="w-full rounded-full select-none">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "save changes"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}