import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getIsland } from "@/lib/island";
import { Button } from "@/components/ui/button";
import TruckLoader from "@/components/TruckLoader";
import PoolHub from "@/components/pool/PoolHub";
import PoolHelpButton from "@/components/pool/PoolHelpButton";
import SchoolSearch from "@/components/pool/SchoolSearch";
import RegisterSchoolDialog from "@/components/pool/RegisterSchoolDialog";

export default function SchoolPool() {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [registering, setRegistering] = useState(false);
  const island = getIsland();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin(window.location.href));
  }, []);

  if (!user) return <div className="min-h-[60vh] flex items-center justify-center"><TruckLoader /></div>;

  const enter = (s) => { setSchool(s); setRegistering(false); };

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between gap-2 mb-6">
          <h1 className="cruise-head text-5xl text-secondary leading-none">schoolpool 🎒</h1>
          <div className="flex items-center gap-2 shrink-0">
            <Button className="h-10" onClick={() => setRegistering(true)}>register a school</Button>
            <PoolHelpButton type="school" />
          </div>
        </div>
        {school ? (
          <PoolHub pool={{ type: "school", id: school.id, name: school.name }} user={user} onExit={() => setSchool(null)} />
        ) : (
          <SchoolSearch island={island} onEnter={enter} />
        )}
      </div>
      <RegisterSchoolDialog open={registering} onOpenChange={setRegistering} island={island} onRegistered={enter} />
    </div>
  );
}