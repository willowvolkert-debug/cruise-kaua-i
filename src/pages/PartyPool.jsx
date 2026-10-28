import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getIsland, ISLAND_MAP } from "@/lib/island";
import { Button } from "@/components/ui/button";
import TruckLoader from "@/components/TruckLoader";
import PoolHub from "@/components/pool/PoolHub";
import PoolHelpButton from "@/components/pool/PoolHelpButton";
import EventList from "@/components/pool/EventList";
import RegisterEventDialog from "@/components/pool/RegisterEventDialog";

export default function PartyPool() {
  const [user, setUser] = useState(null);
  const [event, setEvent] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const island = getIsland();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin(window.location.href));
  }, []);

  if (!user) return <div className="min-h-[60vh] flex items-center justify-center"><TruckLoader /></div>;

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between gap-2 mb-6">
          <div>
            <h1 className="cruise-head text-5xl text-secondary leading-none">partypool 🎉</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">events on {ISLAND_MAP[island].label}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button className="h-10" onClick={() => setRegistering(true)}>register an event</Button>
            <PoolHelpButton type="party" />
          </div>
        </div>
        {event ? (
          <PoolHub pool={{ type: "party", id: event.id, name: event.name }} user={user} onExit={() => setEvent(null)} />
        ) : (
          <EventList island={island} refreshKey={refreshKey} onPick={setEvent} />
        )}
      </div>
      <RegisterEventDialog
        open={registering}
        onOpenChange={setRegistering}
        island={island}
        user={user}
        onRegistered={(ev) => { setRegistering(false); setRefreshKey((k) => k + 1); setEvent(ev); }}
      />
    </div>
  );
}