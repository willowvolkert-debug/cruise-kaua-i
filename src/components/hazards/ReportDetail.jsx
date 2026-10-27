import React, { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { getHazardType, timeAgo } from "./hazardTypes";
import EditReportDialog from "./EditReportDialog";

export default function ReportDetail({ report, user, onVote, onDelete, onEdited, onClose }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const isOwner = !!user && report.reporter_id === user.id;
  const t = getHazardType(report.type);
  const confirmed = report.confirmed_by || [];
  const gone = report.gone_by || [];
  const votedConfirm = !!user && confirmed.includes(user.id);


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
        <Button variant="outline" onClick={() => setConfirmOpen(true)} className="flex-1 rounded-full select-none">
          👎 not there
        </Button>
      </div>
      {user && (
        <div className="flex justify-center gap-4 mt-2">
          <button onClick={() => setEditOpen(true)} className="text-xs underline text-muted-foreground select-none">
            edit details
          </button>
          {isOwner && (
            <button onClick={() => setConfirmOpen(true)} className="text-xs underline text-muted-foreground select-none">
              delete my alert
            </button>
          )}
        </div>
      )}
      {editOpen && <EditReportDialog key={report.id} report={report} open={editOpen} onOpenChange={setEditOpen} onSaved={onEdited} />}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will delete the road alert for everyone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(report)}>Yes, delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}