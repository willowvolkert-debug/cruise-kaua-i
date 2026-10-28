import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { todayHST } from "@/lib/pool";

const empty = { name: "", location: "", event_date: "", event_time: "", description: "" };

export default function RegisterEventDialog({ open, onOpenChange, island, user, onRegistered }) {
  const [f, setF] = useState(empty);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    setSaving(true);
    const ev = await base44.entities.PoolEvent.create({ ...f, island, host_name: user.full_name });
    setSaving(false);
    setF(empty);
    onRegistered(ev);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="cruise-head text-3xl text-secondary">register an event</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input className="h-14 text-lg" placeholder="event name" value={f.name} onChange={set("name")} />
          <Input className="h-14 text-lg" placeholder="location" value={f.location} onChange={set("location")} />
          <div className="grid grid-cols-2 gap-3">
            <Input className="h-14 text-lg" type="date" min={todayHST()} value={f.event_date} onChange={set("event_date")} />
            <Input className="h-14 text-lg" type="time" value={f.event_time} onChange={set("event_time")} />
          </div>
          <Input className="h-14 text-lg" placeholder="details (optional)" value={f.description} onChange={set("description")} />
          <Button className="h-14 text-lg w-full" disabled={saving || !f.name || !f.location || !f.event_date} onClick={submit}>
            {saving ? "registering…" : "register event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}