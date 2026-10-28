import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import TruckLoader from "@/components/TruckLoader";
import { fmtDate, kindLabel } from "@/lib/pool";

export default function PoolConfirmed({ pool, user, refreshKey }) {
  const [data, setData] = useState(null);

  const load = async () => {
    const [d, p, rides] = await Promise.all([
      base44.entities.PoolBooking.filter({ pool_id: pool.id, driver_id: user.id, status: "confirmed" }, { limit: 100 }),
      base44.entities.PoolBooking.filter({ pool_id: pool.id, passenger_id: user.id, status: "confirmed" }, { limit: 100 }),
      base44.entities.PoolRide.filter({ pool_id: pool.id, driver_id: user.id, status: "active" }, { sort: "departure_date", limit: 100 }),
    ]);
    setData({ bookings: [...d.items, ...p.items], rides: rides.items });
  };

  useEffect(() => { load(); }, [pool.id, refreshKey]);

  const cancelRide = async (id) => {
    await base44.entities.PoolRide.update(id, { status: "cancelled" });
    load();
  };

  if (!data) return <div className="py-10 flex justify-center"><TruckLoader /></div>;
  return (
    <div>
      <h2 className="cruise-head text-3xl text-secondary">confirmed rides</h2>
      {data.bookings.length === 0 && data.rides.length === 0 && (
        <p className="text-lg text-muted-foreground py-6">nothing confirmed yet.</p>
      )}
      {data.bookings.map((b) => (
        <div key={b.id} className="border-b-2 border-border py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">{b.driver_id === user.id ? "you're driving" : "you're riding"}</p>
          <p className="cruise-head text-2xl text-secondary leading-tight">{b.ride_summary}</p>
          <p className="text-lg">{fmtDate(b.ride_date)} · {b.ride_time} · {b.seats} seat{b.seats > 1 ? "s" : ""}</p>
          <p className="text-muted-foreground">{b.driver_id === user.id ? `rider: ${b.passenger_name}` : `driver: ${b.driver_name}`}</p>
        </div>
      ))}
      {data.rides.length > 0 && <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-6">rides you posted</p>}
      {data.rides.map((r) => (
        <div key={r.id} className="border-b-2 border-border py-5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">{kindLabel(pool.type, r.ride_kind)}</p>
          <p className="cruise-head text-2xl text-secondary leading-tight">{r.departure_location} → {r.destination}</p>
          <p className="text-lg">{fmtDate(r.departure_date)} · {r.departure_time} · {r.seats_available} seats open</p>
          <Button variant="outline" onClick={() => cancelRide(r.id)}>cancel ride</Button>
        </div>
      ))}
    </div>
  );
}