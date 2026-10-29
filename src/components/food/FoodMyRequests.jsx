import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import TruckLoader from "@/components/TruckLoader";
import { fmtDate, todayHST } from "@/lib/pool";
import FoodChat from "@/components/food/FoodChat";
import FoodRideMatches from "@/components/food/FoodRideMatches";

export default function FoodMyRequests({ user, island, refreshKey }) {
  const [items, setItems] = useState(null);
  const [rides, setRides] = useState([]);

  const load = () => {
    base44.entities.FoodRequest.filter({ requester_id: user.id }, { sort: "-created_date", limit: 100 }).then((r) => setItems(r.items));
    base44.entities.Ride.filter({ island, status: "active", departure_date: { $gte: todayHST() } }, { limit: 200 }).then((r) => setRides(r.items));
  };
  useEffect(load, [refreshKey]);

  const setStatus = async (id, status) => { await base44.entities.FoodRequest.update(id, { status }); load(); };

  if (!items) return <div className="py-10 flex justify-center"><TruckLoader /></div>;
  if (items.length === 0) return <p className="text-lg text-muted-foreground py-6">no requests yet.</p>;

  return (
    <div>
      {items.map((q) => (
        <div key={q.id} className="border-b-2 border-border py-5 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">{q.status}</p>
          <p className="cruise-head text-2xl text-secondary leading-tight">{q.pickup_location} → {q.dropoff_location}</p>
          <p className="text-lg">{fmtDate(q.needed_date)}{q.needed_time ? ` · ${q.needed_time}` : ""} · paying ${q.offered_pay}</p>
          {q.description && <p className="text-foreground">{q.description}</p>}
          {q.status === "open" && <FoodRideMatches request={q} rides={rides} />}
          {q.status === "claimed" && (
            <>
              <p className="text-lg">driver: <strong>{q.driver_name}</strong></p>
              <FoodChat request={q} user={user} onSent={load} />
              <Button className="h-11" onClick={() => setStatus(q.id, "delivered")}>mark delivered</Button>
            </>
          )}
          {(q.status === "open" || q.status === "claimed") && (
            <Button variant="outline" className="h-11 ml-2" onClick={() => setStatus(q.id, "cancelled")}>cancel</Button>
          )}
        </div>
      ))}
    </div>
  );
}