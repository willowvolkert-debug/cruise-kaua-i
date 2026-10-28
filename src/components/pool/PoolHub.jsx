import React, { useState } from "react";
import { Link } from "react-router-dom";
import PoolGetRide from "@/components/pool/PoolGetRide";
import PoolPostRide from "@/components/pool/PoolPostRide";
import PoolInbox from "@/components/pool/PoolInbox";
import PoolConfirmed from "@/components/pool/PoolConfirmed";

const TABS = [
  { id: "get", label: "get a ride" },
  { id: "post", label: "post a ride" },
  { id: "inbox", label: "inbox" },
  { id: "confirmed", label: "confirmed rides" },
];

// Everything inside one schoolpool / event: same carpool format, no alerts/community/FAQ.
export default function PoolHub({ pool, user, onExit }) {
  const [tab, setTab] = useState("get");
  const [key, setKey] = useState(0);
  const bump = () => setKey((k) => k + 1);
  const tabBtn = (active) =>
    `px-4 py-2 rounded-lg font-bold text-base select-none ${active ? "bg-primary text-primary-foreground" : "border-2 border-border text-foreground"}`;

  return (
    <div>
      <button onClick={onExit} className="text-primary font-bold mb-2 select-none">← {pool.type === "school" ? "all schools" : "all events"}</button>
      <h1 className="cruise-head text-4xl text-secondary leading-none mb-4">{pool.name}</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={tabBtn(tab === t.id)}>{t.label}</button>
        ))}
        <Link to="/account" className={tabBtn(false)}>account</Link>
        <Link to="/contactus" className={tabBtn(false)}>contact us</Link>
      </div>
      {tab === "get" && <PoolGetRide pool={pool} user={user} onBooked={bump} />}
      {tab === "post" && <PoolPostRide pool={pool} user={user} onPosted={() => { bump(); setTab("confirmed"); }} />}
      {tab === "inbox" && <PoolInbox pool={pool} user={user} refreshKey={key} />}
      {tab === "confirmed" && <PoolConfirmed pool={pool} user={user} refreshKey={key} />}
    </div>
  );
}