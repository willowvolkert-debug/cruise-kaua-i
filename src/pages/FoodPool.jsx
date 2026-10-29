import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getIsland, ISLAND_MAP } from "@/lib/island";
import TruckLoader from "@/components/TruckLoader";
import PoolHelpButton from "@/components/pool/PoolHelpButton";
import FoodRequestForm from "@/components/food/FoodRequestForm";
import FoodMyRequests from "@/components/food/FoodMyRequests";
import FoodDeliver from "@/components/food/FoodDeliver";

const TABS = [
  { id: "request", label: "request a delivery" },
  { id: "mine", label: "my requests" },
  { id: "deliver", label: "deliver food" },
];

export default function FoodPool() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("request");
  const [key, setKey] = useState(0);
  const island = getIsland();

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      // A driver who said yes during signup before logging in: save it now.
      if (localStorage.getItem("cruise_delivers_food") === "yes" && u.delivers_food !== true) {
        await base44.auth.updateMe({ delivers_food: true });
        u = { ...u, delivers_food: true };
      }
      localStorage.removeItem("cruise_delivers_food");
      setUser(u);
    }).catch(() => base44.auth.redirectToLogin(window.location.href));
  }, []);

  if (!user) return <div className="min-h-[60vh] flex items-center justify-center"><TruckLoader /></div>;

  const tabBtn = (active) =>
    `px-4 py-2 rounded-lg font-bold text-base select-none ${active ? "bg-primary text-primary-foreground" : "border-2 border-border text-foreground"}`;

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between gap-2 mb-6">
          <div>
            <h1 className="cruise-head text-5xl text-secondary leading-none">foodpool 🥬</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">food deliveries on {ISLAND_MAP[island].label}</p>
          </div>
          <PoolHelpButton type="food" />
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={tabBtn(tab === t.id)}>{t.label}</button>
          ))}
        </div>
        {tab === "request" && <FoodRequestForm user={user} island={island} onPosted={() => { setKey((k) => k + 1); setTab("mine"); }} />}
        {tab === "mine" && <FoodMyRequests user={user} island={island} refreshKey={key} />}
        {tab === "deliver" && <FoodDeliver user={user} island={island} onUserChange={setUser} />}
      </div>
    </div>
  );
}