import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TruckLoader from "@/components/TruckLoader";
import { fmtDate } from "@/lib/pool";

function Booking({ b, user, reload }) {
  const [text, setText] = useState("");
  const isDriver = b.driver_id === user.id;
  const other = isDriver ? b.passenger_name : b.driver_name;

  const setStatus = async (status) => {
    if (status === "confirmed") {
      const ride = await base44.entities.PoolRide.get(b.ride_id);
      await base44.entities.PoolRide.update(b.ride_id, { seats_available: Math.max(0, ride.seats_available - b.seats) });
    }
    await base44.entities.PoolBooking.update(b.id, { status });
    reload();
  };

  const send = async () => {
    const messages = [...(b.messages || []), { sender_id: user.id, sender_name: user.full_name, message: text, timestamp: new Date().toISOString() }];
    await base44.entities.PoolBooking.update(b.id, { messages });
    setText("");
    reload();
  };

  return (
    <div className="border-b-2 border-border py-5 space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">{b.status}</p>
      <p className="cruise-head text-2xl text-secondary leading-tight">{b.ride_summary}</p>
      <p className="text-lg">{fmtDate(b.ride_date)} · {b.ride_time} · {b.seats} seat{b.seats > 1 ? "s" : ""}</p>
      <p className="text-muted-foreground">{isDriver ? `rider: ${other}` : `driver: ${other}`}</p>
      {b.note && <p>“{b.note}”</p>}
      <div className="flex gap-2 flex-wrap">
        {isDriver && b.status === "pending" && (
          <>
            <Button onClick={() => setStatus("confirmed")}>confirm</Button>
            <Button variant="outline" onClick={() => setStatus("declined")}>decline</Button>
          </>
        )}
        {!isDriver && ["pending", "confirmed"].includes(b.status) && (
          <Button variant="outline" onClick={() => setStatus("cancelled")}>cancel request</Button>
        )}
      </div>
      {(b.messages || []).map((m, i) => (
        <p key={i} className={`text-base ${m.sender_id === user.id ? "text-right text-primary" : ""}`}>
          <span className="font-bold">{m.sender_name}:</span> {m.message}
        </p>
      ))}
      <div className="flex gap-2 pt-1">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="message…" className="h-12 text-base" />
        <Button disabled={!text.trim()} onClick={send}>send</Button>
      </div>
    </div>
  );
}

export default function PoolInbox({ pool, user, refreshKey }) {
  const [items, setItems] = useState(null);

  const load = async () => {
    const [asDriver, asPassenger] = await Promise.all([
      base44.entities.PoolBooking.filter({ pool_id: pool.id, driver_id: user.id }, { sort: "-created_date", limit: 100 }),
      base44.entities.PoolBooking.filter({ pool_id: pool.id, passenger_id: user.id }, { sort: "-created_date", limit: 100 }),
    ]);
    setItems([...asDriver.items, ...asPassenger.items].sort((a, b) => (a.created_date < b.created_date ? 1 : -1)));
  };

  useEffect(() => { load(); }, [pool.id, refreshKey]);

  if (!items) return <div className="py-10 flex justify-center"><TruckLoader /></div>;
  return (
    <div>
      <h2 className="cruise-head text-3xl text-secondary">inbox</h2>
      {items.length === 0 && <p className="text-lg text-muted-foreground py-6">no requests or messages yet.</p>}
      {items.map((b) => <Booking key={b.id} b={b} user={user} reload={load} />)}
    </div>
  );
}