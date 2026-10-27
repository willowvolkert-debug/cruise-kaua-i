import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Switch } from "@/components/ui/switch";
import { Repeat } from "lucide-react";
import { flowHeading, flowToggleRow } from "./flowStyles";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// The signed-in rider's saved recurring ride requests, with an on/off switch each.
export default function RecurringRequests({ refreshKey = 0 }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    base44.auth.me()
      .then((user) => base44.entities.RecurringRideRequest.filter({ user_id: user.id }))
      .then(setItems)
      .catch(() => setItems([]));
  }, [refreshKey]);

  if (items.length === 0) return null;

  const toggle = async (r, val) => {
    await base44.entities.RecurringRideRequest.update(r.id, { is_active: val });
    setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_active: val } : x)));
  };

  return (
    <div className="space-y-3">
      <p className={`${flowHeading} flex items-center gap-2`}>
        <Repeat className="w-6 h-6 text-primary" /> your recurring rides
      </p>
      {items.map((r) => (
        <div key={r.id} className={flowToggleRow}>
          <div className="min-w-0">
            <p className="text-lg font-bold text-secondary">{r.departure_location} → {r.destination}</p>
            <p className="text-base text-gray-500">
              {(r.weekly_days || []).map((d) => DAY_NAMES[d]).join(", ")} • {r.departure_time}
            </p>
          </div>
          <Switch checked={!!r.is_active} onCheckedChange={(val) => toggle(r, val)} />
        </div>
      ))}
    </div>
  );
}