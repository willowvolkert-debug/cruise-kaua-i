import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import TruckLoader from "@/components/TruckLoader";
import { todayHST } from "@/lib/pool";
import { requestsForRides } from "@/lib/foodMatch";
import DriverFoodToggle from "@/components/food/DriverFoodToggle";
import FoodDeliverRow from "@/components/food/FoodDeliverRow";

export default function FoodDeliver({ user, island, onUserChange }) {
  const [open, setOpen] = useState(null);
  const [mine, setMine] = useState([]);
  const [myRides, setMyRides] = useState([]);

  const load = () => {
    base44.entities.FoodRequest.filter({ island, status: "open", needed_date: { $gte: todayHST() } }, { sort: "needed_date", limit: 200 })
      .then((r) => setOpen(r.items.filter((q) => q.requester_id !== user.id)));
    base44.entities.FoodRequest.filter({ driver_id: user.id, status: "claimed" }, { limit: 100 }).then((r) => setMine(r.items));
    base44.entities.Ride.filter({ driver_id: user.id, status: "active", departure_date: { $gte: todayHST() } }, { limit: 100 }).then((r) => setMyRides(r.items));
  };
  useEffect(load, []);

  const onRoute = open ? requestsForRides(open, myRides) : [];
  const others = open ? open.filter((q) => !onRoute.includes(q)) : [];
  const row = (q, route) => <FoodDeliverRow key={q.id} request={q} user={user} onRoute={route} onClaimedChange={load} onMessage={load} />;

  return (
    <div>
      <DriverFoodToggle user={user} onChange={onUserChange} />
      {user.delivers_food !== true ? (
        <p className="text-lg text-muted-foreground py-4">turn this on to see and claim delivery requests.</p>
      ) : !open ? (
        <div className="py-10 flex justify-center"><TruckLoader /></div>
      ) : (
        <>
          {mine.length > 0 && <h2 className="cruise-head text-3xl text-secondary mt-2">my deliveries</h2>}
          {mine.map((q) => row(q, false))}
          <h2 className="cruise-head text-3xl text-secondary mt-4">open requests</h2>
          {open.length === 0 && <p className="text-lg text-muted-foreground py-6">no open requests on this island right now.</p>}
          {onRoute.map((q) => row(q, true))}
          {others.map((q) => row(q, false))}
        </>
      )}
    </div>
  );
}