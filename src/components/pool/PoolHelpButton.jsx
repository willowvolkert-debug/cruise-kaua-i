import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { POOL_COPY } from "@/lib/pool";

export default function PoolHelpButton({ type }) {
  const [open, setOpen] = useState(false);
  const copy = POOL_COPY[type];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How it works"
        className="inline-flex items-center justify-center h-10 w-10 rounded-lg border-2 border-border text-secondary hover:bg-muted select-none"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="cruise-head text-3xl text-secondary">how {copy.title} works {copy.emoji}</DialogTitle>
          </DialogHeader>
          <ol className="space-y-3 text-foreground">
            {copy.help.map((t, i) => (
              <li key={i} className="flex gap-3 text-base">
                <span className="font-bold text-primary">{i + 1}.</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}