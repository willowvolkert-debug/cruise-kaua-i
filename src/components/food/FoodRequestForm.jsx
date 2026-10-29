import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { todayHST } from "@/lib/pool";
import TownSelect from "@/components/food/TownSelect";

const label = "block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1";

export default function FoodRequestForm({ user, island, onPosted }) {
  const [f, setF] = useState({
    pickup_location: "",
    dropoff_location: "",
    description: "",
    needed_date: todayHST(),
    needed_time: "",
    offered_pay: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const valid = f.pickup_location.trim() && f.dropoff_location.trim() && f.needed_date && f.offered_pay !== "" && Number(f.offered_pay) >= 0;

  const submit = async () => {
    setSaving(true);
    await base44.entities.FoodRequest.create({
      ...f,
      offered_pay: Number(f.offered_pay),
      requester_id: user.id,
      requester_name: user.full_name,
      island,
      status: "open",
    });
    setSaving(false);
    onPosted();
  };

  return (
    <div className="space-y-4">
      <h2 className="cruise-head text-3xl text-secondary">request a delivery</h2>
      <div><label className={label}>pick up town</label><TownSelect placeholder="choose a town" value={f.pickup_location} onChange={(v) => setF({ ...f, pickup_location: v })} /></div>
      <div><label className={label}>drop off town</label><TownSelect placeholder="choose a town" value={f.dropoff_location} onChange={(v) => setF({ ...f, dropoff_location: v })} /></div>
      <div><label className={label}>what's being delivered</label><Textarea className="text-lg" placeholder="grocery order, wholesale boxes…" value={f.description} onChange={set("description")} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={label}>date</label><Input type="date" className="h-14 text-lg" min={todayHST()} value={f.needed_date} onChange={set("needed_date")} /></div>
        <div><label className={label}>time (optional)</label><Input type="time" className="h-14 text-lg" value={f.needed_time} onChange={set("needed_time")} /></div>
      </div>
      <div>
        <label className={label}>how much will you pay to have it dropped off? ($)</label>
        <Input type="number" min={0} step="1" className="h-14 text-lg" placeholder="15" value={f.offered_pay} onChange={set("offered_pay")} />
      </div>
      <Button className="h-12 text-lg" disabled={!valid || saving} onClick={submit}>{saving ? "posting…" : "post request"}</Button>
    </div>
  );
}