import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, BellRing, BellOff, Check, Loader2 } from "lucide-react";

export default function SmsSettingsCard({ user, onUpdated }) {
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [justEnabled, setJustEnabled] = useState(false);

  const enabled = !!user?.sms_notifications_enabled;

  const handleEnable = async () => {
    setError("");
    if (!phone.trim()) {
      setError("please enter your phone number to turn on text alerts.");
      return;
    }
    if (!consent) {
      setError("please check the consent box to opt in to text alerts.");
      return;
    }
    setLoading(true);
    try {
      const wasOff = !enabled;
      await base44.auth.updateMe({
        phone_number: phone.trim(),
        sms_notifications_enabled: true,
        sms_disabled_inactivity: false,
        last_activity_date: new Date().toISOString()
      });
      // If the user newly added a phone number, send a welcome text
      if (wasOff && !user?.welcome_sms_sent && phone.trim()) {
        import("@/functions/sendWelcomeSms")
          .then(({ sendWelcomeSms }) => sendWelcomeSms({}).catch(() => {}))
          .catch(() => {});
      }
      setJustEnabled(true);
      setConsent(false);
      await onUpdated?.();
    } catch (e) {
      setError("couldn't update your text alert settings. please try again.");
    }
    setLoading(false);
  };

  const handleDisable = async () => {
    setError("");
    setLoading(true);
    try {
      await base44.auth.updateMe({ sms_notifications_enabled: false });
      await onUpdated?.();
    } catch (e) {
      setError("couldn't turn off text alerts. please try again.");
    }
    setLoading(false);
  };

  return (
    <Card className={`shadow-md rounded-3xl border-2 ${enabled ? "border-green-200 bg-green-50/50" : "border-amber-200 bg-amber-50/60"}`}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-2xl shrink-0 ${enabled ? "bg-green-100" : "bg-amber-100"}`}>
            {enabled ? <BellRing className="w-6 h-6 text-green-600" /> : <BellOff className="w-6 h-6 text-amber-600" />}
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-lg ${enabled ? "text-green-900" : "text-amber-900"}`}>
              {enabled ? "text alerts are on" : "text alerts are off"}
            </h3>
            <p className={`text-sm mt-1 ${enabled ? "text-green-800" : "text-amber-800"}`}>
              {enabled
                ? `You're getting SMS ride notifications at ${user?.phone_number || phone || "your number"}. Turn them off anytime below.`
                : user?.sms_disabled_inactivity
                  ? "We paused your text alerts after a stretch of inactivity. Turn them back on to start receiving ride notifications again."
                  : "Get ride confirmations, reminders, and messages by text. Turn them on anytime — you can opt out by replying STOP."}
            </p>
          </div>
        </div>

        {enabled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-800 bg-white/70 rounded-2xl px-3 py-2 border border-green-200">
              <Phone className="w-4 h-4" />
              <span className="font-medium">{user?.phone_number || phone}</span>
            </div>
            <Button
              onClick={handleDisable}
              disabled={loading}
              variant="outline"
              className="w-full rounded-2xl border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BellOff className="w-4 h-4 mr-2" />}
              turn text alerts off
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-amber-900">📱 phone number</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., (808) 555-1234"
                className="rounded-2xl bg-white"
              />
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="sms-resub-consent"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-400 accent-green-700 cursor-pointer"
              />
              <label htmlFor="sms-resub-consent" className="text-xs text-gray-700 leading-relaxed cursor-pointer">
                I agree to receive recurring automated transactional SMS text messages from <strong>Cruise Hawaiʻi</strong> at the number above (ride confirmations, reminders, and messages). Consent is not required to use the platform. Message &amp; data rates may apply. Reply <strong>STOP</strong> to unsubscribe, <strong>HELP</strong> for help. See our <a href="/sms-opt-in" className="text-green-700 underline" target="_blank" rel="noreferrer">SMS Terms</a>.
              </label>
            </div>
            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
            <Button
              onClick={handleEnable}
              disabled={loading || !phone.trim() || !consent}
              className="w-full bg-amber-600 hover:bg-amber-700 rounded-2xl"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BellRing className="w-4 h-4 mr-2" />}
              turn text alerts on
            </Button>
            {justEnabled && (
              <p className="text-sm text-green-700 font-medium flex items-center gap-1 justify-center">
                <Check className="w-4 h-4" /> text alerts turned on!
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}