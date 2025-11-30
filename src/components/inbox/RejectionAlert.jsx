import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function RejectionAlert({ rejectedBookings, onDismiss }) {
  if (!rejectedBookings || rejectedBookings.length === 0) return null;

  return (
    <>
      {rejectedBookings.map(booking => (
        <Alert key={booking.id} className="bg-red-50 border-red-300 rounded-3xl">
          <XCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="font-bold text-red-800">your ride request has been rejected</AlertTitle>
          <AlertDescription className="text-red-700">
            <p className="mb-3">
              The driver was unable to accept your request at this time. 
              Your payment will be refunded automatically.
            </p>
            <Button
              onClick={() => onDismiss(booking.id)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-2xl"
            >
              got it
            </Button>
          </AlertDescription>
        </Alert>
      ))}
    </>
  );
}