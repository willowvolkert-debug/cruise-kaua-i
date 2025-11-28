import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StripePaymentForm from "./StripePaymentForm";

export default function StripePaymentModal({ isOpen, onClose, amount, bookingId, rideId, onSuccess }) {
  const handleSuccess = (paymentData) => {
    onSuccess(paymentData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary">
            Complete Payment
          </DialogTitle>
        </DialogHeader>
        <StripePaymentForm
          amount={amount}
          bookingId={bookingId}
          rideId={rideId}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}