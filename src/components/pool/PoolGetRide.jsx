import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { pool as poolFn } from "@/functions/pool";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TruckLoader from "@/components/TruckLoader";
import { fmtDate, kindLabel } from "@/lib/pool";

function RideRow({ ride, pool, user, onBooked }) {
  const [open, setOpen] = useState(false);
  const [seats, setSeats] = useState(1);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const book = async () => {
    setSaving(true);
    await base44.entities.PoolBooking.create({
      ride_id: ride.id,
      pool_type: pool.type,
      pool_id: pool.id,
      pool_name: pool.name,
      ride_summary: `${ride.departure_location} → ${ride.destination}`,
      ride_date: ride.departure_date,
      ride_time: ride.departure_time,
      driver_id: ride.driver_id,
      driver_name: ride.driver_name,
      passenger_id: user.id,
      passenger_name: user.full_name,
      seats: Number(seats),
      note,
      status: "pending",
    });
    setSaving(false);
    onBooked();
  };

  return (
    <div className="border-b-2 border-border py-5 space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">{kindLabel(pool.type, ride.ride_kind)}</p>
      <p className="cruise-head text-2xl text-secondary leading-tight">{ride.departure_location} → {ride.destination}</p>
      <p className="text-lg text-foreground">{fmtDate(ride.departure_date)} · {ride.departure_time} · {ride.seats_available} seat{ride.seats_available > 1 ? "s" : ""}</p>
      <p className="text-muted-foreground">driver: {ride.driver_name}</p>
      {ride.notes && <p className="text-foreground">{ride.notes}</p>}
      {!open ? (
        <Button className="h-12 text-lg" onClick={() => setOpen(true)}>request seats</Button>
      ) : (
        <div className="space-y-3 pt-2">
          <Input type="number" min={1} max={ride.seats_available} value={seats} onChange={(e) => setSeats(e.target.value)} className="h-14 text-lg" />
          <Input placeholder={pool.type === "school" ? "child's name, pickup spot…" : "pickup spot, how many in your group…"} value={note} onChange={(e) => setNote(e.target.value)} className="h-14 text-lg" />
          <Button className="h-12 text-lg" disabled={saving || seats < 1 || seats > ride.seats_available} onClick={book}>
            {saving ? "sending…" : "send request"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PoolGetRide({ pool, user, onBooked }) {
  const [rides, setRides] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    poolFn({ action: "listRides", pool_type: pool.type, pool_id: pool.id })
      .then((r) => setRides(r.data.rides.filter((x) => x.driver_id !== user.id)))
      .catch((e) => setError(e?.response?.data?.error || "Could not load rides"));

  useEffect(() => { load(); }, [pool.id]);

  if (error) return <p className="text-destructive text-lg py-6">{error}</p>;
  if (!rides) return <div className="py-10 flex justify-center"><TruckLoader /></div>;

  return (
    <div>
      <h2 className="cruise-head text-3xl text-secondary mb-1">
        {pool.type === "party" ? "find a safe ride home" : "get a ride"}
      </h2>
      {rides.length === 0 && <p className="text-lg text-muted-foreground py-6">no rides posted yet. be the first to post one!</p>}
      {rides.map((r) => (
        <RideRow key={r.id} ride={r} pool={pool} user={user} onBooked={() => { load(); onBooked(); }} />
      ))}
    </div>
  );
}