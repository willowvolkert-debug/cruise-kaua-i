import { getIsland } from "@/lib/island";
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import ReliefMap from "@/components/relief/ReliefMap";
import ReliefList from "@/components/relief/ReliefList";
import ReliefForm from "@/components/relief/ReliefForm";
import ReliefDetail from "@/components/relief/ReliefDetail";

export default function GreySkies({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    // Relief posts expire 1 month after posting
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const res = await base44.entities.ReliefPost.filter({ created_date: { $gte: since }, island: getIsland() }, { sort: "-created_date", limit: 500 });
    setPosts(res.items);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const startAdd = () => (user ? setAdding(true) : base44.auth.redirectToLogin(window.location.href));

  return (
    <div className="p-3 md:p-8 bg-background min-h-screen">
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="cruise-head text-5xl md:text-6xl text-secondary leading-none">community based disaster relief</h1>
          <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
            In turbulent times, Cruise shifts from being a carpooling service to showing the resources and needs of areas affected by disaster. Zoom in and out of the map to see the locations of resources and needs: needs in red and resources in blue. See a toggled list of resources &amp; needs below the map and filter by area. Reach out to the owner of a resource or need by clicking on it and pressing "message", which will put you directly in touch with them.
          </p>
        </div>
        <button onClick={startAdd} className="w-full py-5 rounded-3xl bg-green-600 hover:bg-green-700 text-white font-heading text-2xl uppercase select-none">
          ADD RESOURCE OR NEED HERE
        </button>
        <ReliefMap posts={posts} onSelect={setSelected} className="h-96" />
        {loading ? <p className="text-center text-muted-foreground">loading...</p> : <ReliefList posts={posts} onSelect={setSelected} />}
      </div>
      {adding && <ReliefForm open user={user} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
      {selected && <ReliefDetail post={selected} user={user} onClose={() => setSelected(null)} onRemoved={() => { setSelected(null); load(); }} />}
    </div>
  );
}