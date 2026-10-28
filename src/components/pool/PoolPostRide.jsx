import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RIDE_KINDS, todayHST } from "@/lib/pool";

const label = "block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1";

export default function PoolPostRide({ pool, user, onPosted }) {
  const kinds = RIDE_KINDS[pool.type];
  const [f, setF] = useState({
    ride_kind: kinds[0].value,
    departure_location: pool.type === "party" ? pool.name : "",
    destination: "",
    departure_date: todayHST(),
    departure_time: "",
    seats_available: 3,
    notes: "",
  });
  const [pledge, setPledge] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const needsPledge = pool.type === "party" && f.ride_kind === "sober_ride_home";
  const valid = f.departure_location && f.destination && f.departure_date && f.departure_time && f.seats_available > 0 && (!needsPledge || pledge);

  const submit = async () => {
    setSaving(true);
    await base44.entities.PoolRide.create({
      ...f,
      seats_available: Number(f.seats_available),
      pool_type: pool.type,
      pool_id: pool.id,
      pool_name: pool.name,
      driver_id: user.id,
      driver_name: user.full_name,
      status: "active",
    });
    setSaving(false);
    onPosted();
  };

  return (
    <div className="space-y-4">
      <h2 className="cruise-head text-3xl text-secondary">post a ride</h2>
      <div>
        <label className={label}>type of ride</label>
        <select value={f.ride_kind} onChange={set("ride_kind")} className="w-full h-14 text-lg rounded-md border border-input bg-background px-3">
          {kinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
      </div>
      <div><label className={label}>from</label><Input className="h-14 text-lg" value={f.departure_location} onChange={set("departure_location")} /></div>
      <div><label className={label}>to</label><Input className="h-14 text-lg" value={f.destination} onChange={set("destination")} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={label}>date</label><Input className="h-14 text-lg" type="date" min={todayHST()} value={f.departure_date} onChange={set("departure_date")} /></div>
        <div><label className={label}>time</label><Input className="h-14 text-lg" type="time" value={f.departure_time} onChange={set("departure_time")} /></div>
      </div>
      <div><label className={label}>open seats</label><Input className="h-14 text-lg" type="number" min={1} max={8} value={f.seats_available} onChange={set("seats_available")} /></div>
      <div><label className={label}>notes (optional)</label><Input className="h-14 text-lg" value={f.notes} onChange={set("notes")} /></div>
      {needsPledge && (
        <label className="flex items-start gap-3 text-lg">
          <input type="checkbox" className="mt-1.5 w-5 h-5" checked={pledge} onChange={(e) => setPledge(e.target.checked)} />
          <span>I pledge to stay sober and drive safely.</span>
        </label>
      )}
      <Button className="h-14 text-xl w-full" disabled={!valid || saving} onClick={submit}>
        {saving ? "posting…" : "post ride"}
      </Button>
    </div>
  );
}