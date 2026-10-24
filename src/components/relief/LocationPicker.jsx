import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReliefMap from "@/components/relief/ReliefMap";

export default function LocationPicker({ open, onClose, value, onConfirm }) {
  const [pin, setPin] = useState(value);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>drop a pin</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Tap the map to place the pin where the resource or need is.</p>
        <ReliefMap picked={pin} onPick={setPin} center={value || undefined} zoom={value ? 13 : 10} className="h-72" />
        <Button disabled={!pin} onClick={() => onConfirm(pin)} className="w-full">
          confirm location
        </Button>
      </DialogContent>
    </Dialog>
  );
}