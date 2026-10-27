import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export default function SignupInfoCard({ user, onComplete }) {
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [smsConsent, setSmsConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isValid = phone.trim() && smsConsent;

  const handleSubmit = async () => {
    setError("");

    if (!phone.trim()) { setError("Please enter your phone number."); return; }
    if (!smsConsent) { setError("Please agree to SMS notifications to continue."); return; }

    setSaving(true);
    try {
      await base44.auth.updateMe({
        phone_number: phone.replace(/\D/g, "").replace(/^1/, ""),
        sms_notifications_enabled: true,
        has_seen_signup_info_card: true,
      });

      // Send welcome SMS
      import("@/functions/sendWelcomeSms").then(({ sendWelcomeSms }) => {
        sendWelcomeSms({}).catch(() => {});
      }).catch(() => {});
    } catch (e) {
      setError("Something went wrong. Please try again.");
      setSaving(false);
      return;
    }

    setSaving(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-card rounded-3xl shadow-2xl border-2 border-foreground/10 max-w-md w-full overflow-hidden my-4">
        {/* Header */}
        <div className="px-6 pt-10 pb-6 text-center text-white bg-primary">
          <div className="text-4xl mb-2">📱</div>
          <h1 className="cruise-head text-4xl text-white">
            what's your number?
          </h1>
          <p className="text-white/80 text-base mt-1">we'll text you ride updates & reminders</p>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-secondary">phone number *</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(""); }}
              placeholder="(808) 555-1234"
              className="rounded-2xl text-base py-5"
              autoFocus
            />
          </div>

          {/* SMS Consent */}
          <div className="flex items-start gap-2 p-3 bg-muted border border-border rounded-2xl">
            <Checkbox
              id="sms-consent"
              checked={smsConsent}
              onCheckedChange={() => { setSmsConsent(v => !v); setError(""); }}
              className="mt-0.5 shrink-0"
            />
            <Label htmlFor="sms-consent" className="cursor-pointer text-xs text-foreground leading-relaxed">
              I agree to receive automated transactional SMS messages from <strong>Cruise Hawaiʻi</strong> (ride confirmations, reminders, booking notifications). Message &amp; data rates may apply. Reply <strong>STOP</strong> to unsubscribe. <a href="/sms-opt-in" className="text-green-700 underline" target="_blank">SMS Terms</a>.
            </Label>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-2xl p-3 leading-relaxed">{error}</p>
          )}
        </div>

        {/* Submit */}
        <div className="px-6 pb-6">
          <Button
            onClick={handleSubmit}
            disabled={saving || !isValid}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-5 text-base font-bold shadow-lg"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> saving...</>
            ) : (
              "continue →"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}