import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

export default function CancelBookingModal({ isOpen, onClose, booking, onConfirmCancel }) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }

    setIsSubmitting(true);
    await onConfirmCancel(booking, reason);
    setIsSubmitting(false);
    setReason('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            cancel booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-gray-600">
            Are you sure you want to cancel this booking? This action cannot be undone.
          </p>

          <div className="space-y-2">
            <Label htmlFor="reason">reason for cancellation *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need to cancel..."
              className="h-24"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <p className="font-semibold mb-1">refund policy:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Full refund if cancelled 24+ hours before ride</li>
              <li>50% refund if cancelled within 24 hours</li>
              <li>No refund if cancelled within 2 hours of ride</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              keep booking
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !reason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? 'cancelling...' : 'confirm cancellation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}