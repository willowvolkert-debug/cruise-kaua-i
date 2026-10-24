import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin } from "lucide-react";
import LocationPicker from "@/components/relief/LocationPicker";

export default function ReliefForm({ open, onClose, user, onSaved }) {
  const [kind, setKind] = useState("need");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [locationText, setLocationText] = useState("");
  const [pin, setPin] = useState(null);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  const valid = title.trim() && pin && locationText.trim();

  const submit = async () => {
    setSaving(true);
    await base44.entities.ReliefPost.create({
      kind,
      title: title.trim(),
      details: details.trim(),
      location_text: locationText.trim(),
      lat: pin[0],
      lng: pin[1],
      owner_id: user.id,
      owner_name: user.full_name || user.username || user.email?.split("@")[0] || "Cruise member",
      owner_username: user.username || undefined,
      owner_profile_picture_url: user.profile_picture_url || undefined,
      owner_bio: user.bio || undefined,
      owner_age: user.age || undefined,
      owner_gender: user.gender || undefined,
    });
    setSaving(false);
    setTitle(""); setDetails(""); setLocationText(""); setPin(null);
    onSaved();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>add resource or need</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Location</label>
              <Input value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="area, e.g. Hanalei" className="mt-1" />
              <Button type="button" variant="outline" onClick={() => setPicking(true)} className="w-full mt-2">
                <MapPin className="w-4 h-4 mr-2" /> {pin ? "pin dropped – change" : "drop a pin on the map"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" onClick={() => setKind("need")} className={kind === "need" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-card text-red-600 border-2 border-red-600 hover:bg-red-50"}>
                need
              </Button>
              <Button type="button" onClick={() => setKind("resource")} className={kind === "resource" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-card text-blue-600 border-2 border-blue-600 hover:bg-blue-50"}>
                resource
              </Button>
            </div>
            <div>
              <label className="text-sm font-semibold">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-semibold">Details</label>
              <Textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} className="mt-1" />
            </div>
            <Button disabled={!valid || saving} onClick={submit} className="w-full bg-green-600 hover:bg-green-700 text-white">
              {saving ? "posting..." : "post"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {picking && (
        <LocationPicker open value={pin} onClose={() => setPicking(false)} onConfirm={(p) => { setPin(p); setPicking(false); }} />
      )}
    </>
  );
}