import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import HazardMap from "./HazardMap";
import ReportDialog from "./ReportDialog";
import ReportDetail from "./ReportDetail";
import { HAZARD_TTL_HOURS } from "./hazardTypes";

export default function HazardPanel({ user }) {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [picked, setPicked] = useState(null);
  const [open, setOpen] = useState(false);
  const [flyTo, setFlyTo] = useState(null);

  const load = useCallback(async () => {
    const since = new Date(Date.now() - HAZARD_TTL_HOURS * 3600 * 1000).toISOString();
    const page = await base44.entities.RoadReport.filter(
      { status: "active", created_date: { $gte: since } },
      { sort: "-created_date", limit: 200 }
    );
    setReports(page.items);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  const startReport = () => {
    if (!user) return base44.auth.redirectToLogin(window.location.href);
    setOpen(true);
  };

  const vote = async (report, kind) => {
    if (!user) return base44.auth.redirectToLogin(window.location.href);
    const confirmed = [...(report.confirmed_by || [])];
    const gone = [...(report.gone_by || [])];
    (kind === "confirm" ? confirmed : gone).push(user.id);
    const cleared = gone.length >= 2 && gone.length > confirmed.length;
    const updated = await base44.entities.RoadReport.update(report.id, {
      confirmed_by: confirmed,
      gone_by: gone,
      status: cleared ? "cleared" : "active",
    });
    if (cleared) {
      setSelected(null);
      setReports((rs) => rs.filter((r) => r.id !== report.id));
      toast.success("Marked as cleared. Thanks!");
    } else {
      setSelected({ ...report, ...updated });
      setReports((rs) => rs.map((r) => (r.id === report.id ? { ...r, ...updated } : r)));
    }
  };

  return (
    <div className="mb-5 p-3 rounded-3xl border-2 border-foreground/10 bg-card">
      <div className="flex items-center justify-between mb-2 px-1">
        <div>
          <h2 className="cruise-head text-3xl text-secondary leading-none">road alerts</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {reports.length ? `${reports.length} active report${reports.length === 1 ? "" : "s"} on island` : "all clear right now"}
          </p>
        </div>
      </div>
      <HazardMap
        reports={reports}
        selectedId={selected?.id}
        onSelect={setSelected}
        onPick={setPicked}
        picked={picked}
        flyTo={flyTo}
      />
      <p className="text-[11px] text-muted-foreground mt-1.5 px-1">
        Tap a pin to confirm it. When you report, type the place (even one you already passed) or tap the map to drop a pin.
        {picked && (
          <button onClick={() => setPicked(null)} className="ml-1 underline select-none">clear pin</button>
        )}
      </p>
      {selected && (
        <ReportDetail report={selected} user={user} onVote={vote} onClose={() => setSelected(null)} />
      )}
      <Button onClick={startReport} className="w-full mt-3 rounded-full h-12 text-base select-none">
        ⚠️ report a hazard or traffic
      </Button>
      {user && (
        <ReportDialog
          open={open}
          onOpenChange={setOpen}
          user={user}
          picked={picked}
          onCreated={(r) => {
            setPicked(null);
            setReports((rs) => [r, ...rs]);
            setFlyTo([r.lat, r.lng]);
          }}
        />
      )}
    </div>
  );
}