import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/pool";
import FoodChat from "@/components/food/FoodChat";

export default function FoodDeliverRow({ request: q, user, onClaimedChange, onMessage, onRoute }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mine = q.driver_id === user.id;

  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("food", { action, id: q.id });
      onClaimedChange();
    } catch (e) {
      setError(e?.response?.data?.error || "Something went wrong");
    }
    setBusy(false);
  };

  return (
    <div className="border-b-2 border-border py-5 space-y-2">
      {onRoute && <p className="text-xs font-bold uppercase tracking-widest text-primary">on your carpool route</p>}
      <p className="cruise-head text-2xl text-secondary leading-tight">{q.pickup_location} → {q.dropoff_location}</p>
      <p className="text-lg">{fmtDate(q.needed_date)}{q.needed_time ? ` · ${q.needed_time}` : ""} · pays <strong>${q.offered_pay}</strong></p>
      {q.description && <p className="text-foreground">{q.description}</p>}
      <p className="text-muted-foreground">requested by {q.requester_name}</p>
      {error && <p className="text-destructive">{error}</p>}
      {mine ? (
        <>
          <FoodChat request={q} user={user} onSent={onMessage} />
          <Button variant="outline" className="h-11" disabled={busy} onClick={() => run("unclaim")}>give back</Button>
        </>
      ) : (
        <Button className="h-12 text-lg" disabled={busy} onClick={() => run("claim")}>{busy ? "claiming…" : "I'll deliver this"}</Button>
      )}
    </div>
  );
}