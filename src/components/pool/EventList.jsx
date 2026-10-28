import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import TruckLoader from "@/components/TruckLoader";
import { fmtDate, todayHST } from "@/lib/pool";

export default function EventList({ island, refreshKey, onPick }) {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    base44.entities.PoolEvent.filter({ island, event_date: { $gte: todayHST() } }, { sort: "event_date", limit: 100 })
      .then((r) => setEvents(r.items));
  }, [island, refreshKey]);

  if (!events) return <div className="py-10 flex justify-center"><TruckLoader /></div>;
  if (events.length === 0) return <p className="text-lg text-muted-foreground py-6">no upcoming events on this island yet. register one in the top right.</p>;

  return (
    <div>
      {events.map((e) => (
        <button key={e.id} onClick={() => onPick(e)} className="w-full text-left border-b-2 border-border py-4 select-none">
          <p className="cruise-head text-2xl text-secondary">{e.name}</p>
          <p className="text-lg">{fmtDate(e.event_date)}{e.event_time ? ` · ${e.event_time}` : ""}</p>
          <p className="text-muted-foreground">{e.location}</p>
          {e.description && <p className="text-foreground">{e.description}</p>}
        </button>
      ))}
    </div>
  );
}