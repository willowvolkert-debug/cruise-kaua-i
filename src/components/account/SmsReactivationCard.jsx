import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";

export default function SmsReactivationCard({ user, onReactivated }) {
  const [loading, setLoading] = React.useState(false);

  const handleReactivate = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe({
        sms_notifications_enabled: true,
        sms_disabled_inactivity: false,
        last_activity_date: new Date().toISOString()
      });
      await onReactivated?.();
    } catch (e) {
      // ignore — user can retry
    }
    setLoading(false);
  };

  return (
    <Card className="shadow-md border-amber-200 bg-amber-50 rounded-3xl">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-2xl shrink-0">
            <BellRing className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 text-lg">we paused your text alerts</h3>
            <p className="text-sm text-amber-800 mt-1">
              We noticed you haven't been active on Cruise Kauaʻi recently, so we turned off your SMS ride notifications to avoid sending you unwanted messages. Your account still works — you just won't get text alerts until you turn them back on.
            </p>
          </div>
        </div>
        <Button onClick={handleReactivate} disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 rounded-2xl">
          {loading ? "turning back on..." : "turn text alerts back on"}
        </Button>
      </CardContent>
    </Card>
  );
}