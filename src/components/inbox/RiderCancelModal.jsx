import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

export default function RiderCancelModal({ isOpen, onClose, booking, ride, onConfirmCancel }) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  // Calculate hours until ride using Hawaii time
  const getHoursUntilRide = () => {
    if (!ride?.departure_date || !ride?.departure_time) return 999;
    
    // Parse ride time - handle various formats like "10:00", "10am", "1030am"
    const parseTime = (timeStr) => {
      if (!timeStr) return { hours: 12, minutes: 0 };
      const normalized = timeStr.toLowerCase().trim();
      
      if (normalized.includes(':')) {
        const [h, m] = normalized.replace(/[ap]m/i, '').split(':').map(Number);
        let hours = h;
        if (normalized.includes('pm') && hours < 12) hours += 12;
        if (normalized.includes('am') && hours === 12) hours = 0;
        return { hours, minutes: m || 0 };
      }
      
      const match = normalized.match(/^(\d{1,4})(am|pm)?$/);
      if (match) {
        const numPart = match[1];
        const period = match[2];
        let hours, minutes;
        
        if (numPart.length <= 2) {
          hours = parseInt(numPart);
          minutes = 0;
        } else if (numPart.length === 3) {
          hours = parseInt(numPart[0]);
          minutes = parseInt(numPart.substring(1));
        } else {
          hours = parseInt(numPart.substring(0, 2));
          minutes = parseInt(numPart.substring(2));
        }
        
        if (period === 'pm' && hours < 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        
        return { hours, minutes };
      }
      
      return { hours: 12, minutes: 0 };
    };

    // Get current Hawaii time
    const now = new Date();
    const hawaiiFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Pacific/Honolulu',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const hawaiiParts = hawaiiFormatter.formatToParts(now);
    const getPart = (type) => hawaiiParts.find(p => p.type === type)?.value;
    
    const hawaiiNow = new Date(
      parseInt(getPart('year')),
      parseInt(getPart('month')) - 1,
      parseInt(getPart('day')),
      parseInt(getPart('hour')),
      parseInt(getPart('minute'))
    );

    // Parse ride date/time as Hawaii local time
    const [year, month, day] = ride.departure_date.split('-').map(Number);
    const { hours, minutes } = parseTime(ride.departure_time);
    const rideDateTime = new Date(year, month - 1, day, hours, minutes);

    return (rideDateTime.getTime() - hawaiiNow.getTime()) / (1000 * 60 * 60);
  };

  const hoursUntilRide = getHoursUntilRide();

  const getRefundInfo = () => {
    if (hoursUntilRide >= 24) {
      return {
        percentage: "100%",
        description: "You will receive a full refund of the trip cost (Cruise Kauaʻi fee and Stripe processing fees are non-refundable).",
        color: "green"
      };
    } else if (hoursUntilRide >= 2) {
      return {
        percentage: "50%",
        description: "You will receive a 50% refund of the trip cost (Cruise Kauaʻi fee and Stripe processing fees are non-refundable).",
        color: "yellow"
      };
    } else {
      return {
        percentage: "0%",
        description: "Unfortunately, cancellations within 2 hours of the ride are not eligible for a refund.",
        color: "red"
      };
    }
  };

  const refundInfo = getRefundInfo();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }

    setIsSubmitting(true);
    await onConfirmCancel(booking, reason, refundInfo.percentage);
    setIsSubmitting(false);
    setReason('');
    setCancelled(true);
    setTimeout(() => { setCancelled(false); onClose(); }, 1800);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            cancel your ride
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {cancelled ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-3xl text-green-600">✓</span>
              </div>
              <p className="text-lg font-bold text-green-700">cancellation confirmed</p>
              <p className="text-sm text-gray-500 text-center">your ride has been cancelled and any refund is being processed.</p>
            </div>
          ) : (
            <>
          <p className="text-gray-600">
            Are you sure you want to cancel this ride? Please review the refund policy below.
          </p>

          {/* Refund Policy Box */}
          <div className={`rounded-2xl p-4 border ${
            refundInfo.color === 'green' ? 'bg-green-50 border-green-200' :
            refundInfo.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
            'bg-red-50 border-red-200'
          }`}>
            <p className={`font-bold text-lg mb-2 ${
              refundInfo.color === 'green' ? 'text-green-800' :
              refundInfo.color === 'yellow' ? 'text-yellow-800' :
              'text-red-800'
            }`}>
              Refund: {refundInfo.percentage} of trip cost
            </p>
            <p className={`text-sm ${
              refundInfo.color === 'green' ? 'text-green-700' :
              refundInfo.color === 'yellow' ? 'text-yellow-700' :
              'text-red-700'
            }`}>
              {refundInfo.description}
            </p>
          </div>

          {/* Refund Policy Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm text-gray-700">
            <p className="font-semibold mb-1">Refund Policy:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>24+ hours before ride: Full trip cost refund</li>
              <li>2-24 hours before ride: 50% trip cost refund</li>
              <li>Within 2 hours: No refund</li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              Note: Cruise Kauaʻi service fees and Stripe processing fees are non-refundable.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">reason for cancellation *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need to cancel..."
              className="h-24 rounded-2xl"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-2xl"
            >
              keep my ride
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !reason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-2xl"
            >
              {isSubmitting ? 'cancelling...' : 'continue to cancel'}
            </Button>
          </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}