import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { getHazardType, timeAgo } from "./hazardTypes";

export default function ReportDetail({ report, user, onVote, onClose }) {
  const t = getHazardType(report.type);
  const confirmed = report.confirmed_by || [];
  const gone = report.gone_by || [];
  const votedConfirm = !!user && confirmed.includes(user.id);
  const votedGone = !!user && gone.includes(user.id);
  const voted = votedConfirm || votedGone;

  return (
    <div className="mt-3 p-4 rounded-2xl border-2 border-foreground/10 bg-card">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{t.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-lg leading-tight">{t.label}</p>
          <p className="text-xs text-muted-foreground">
            reported {timeAgo(report.created_date)} by {report.reporter_name || "a neighbor"} · 👍 {confirmed.length} still there
          </p>
          {report.place && <p className="text-sm font-semibold text-foreground mt-1.5">📍 {report.place}</p>}
          {report.note && <p className="text-sm text-foreground mt-1.5">{report.note}</p>}
        </div>
        <button onClick={onClose} className="text-muted-foreground select-none" aria-label="close">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <Button disabled={votedConfirm} onClick={() => onVote(report, "confirm")} className="flex-1 rounded-full select-none">
          👍 still there
        </Button>
        <Button disabled={votedGone} variant="outline" onClick={() => onVote(report, "gone")} className="flex-1 rounded-full select-none">
          👎 not there
        </Button>
      </div>
      {voted && <p className="text-xs text-muted-foreground mt-2 text-center">Thanks for the update! You can change your answer anytime.</p>}
    </div>
  );
}