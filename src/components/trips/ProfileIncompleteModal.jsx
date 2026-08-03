import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";

export default function ProfileIncompleteModal({ isOpen, missingItems, action, onClose }) {
  const navigate = useNavigate();

  if (!isOpen || !missingItems?.length) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl text-secondary flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            finish your profile
          </DialogTitle>
          <DialogDescription className="text-sm">
            you need to complete a few things before you can {action}:
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 py-2">
          {missingItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-amber-500 shrink-0">⚠️</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-2">
          <Button
            onClick={() => navigate("/account")}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-bold"
          >
            go to my account →
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full rounded-full"
          >
            later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}