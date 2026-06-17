import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export default function SignupInfoCard({ user, onComplete }) {
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [username, setUsername] = useState(user?.username || "");
  const [age, setAge] = useState(user?.age || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [smsConsent, setSmsConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isValid = username.trim() && age && parseInt(age) >= 18 && gender && phone.trim() && smsConsent;

  const handleSubmit = async () => {
    setError("");

    if (!username.trim()) { setError("Please choose a username."); return; }
    if (!age || parseInt(age) < 18) { setError("You must be at least 18 years old."); return; }
    if (!gender) { setError("Please select your gender."); return; }
    if (!phone.trim()) { setError("Please enter your phone number."); return; }
    if (!smsConsent) { setError("Please agree to SMS notifications to continue."); return; }

    setSaving(true);
    try {
      await base44.auth.updateMe({
        username: username.trim(),
        age: parseInt(age),
        gender,
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
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden my-4">
        {/* Header */}
        <div
          className="px-6 pt-10 pb-6 text-center text-white"
          style={{ background: "linear-gradient(135deg, #1a4a2e 0%, #2d6a4f 100%)" }}
        >
          <div className="text-4xl mb-2">🤙</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            aloha! let's get you set up
          </h1>
          <p className="text-green-200 text-sm mt-1">just a few quick details</p>
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

          {/* Username */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-secondary">username *</Label>
            <Input
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              placeholder="no spaces (e.g. kaleo_808)"
              className="rounded-2xl text-base py-5"
            />
          </div>

          {/* Age + Gender side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-secondary">age *</Label>
              <Input
                type="number"
                min={18}
                value={age}
                onChange={(e) => { setAge(e.target.value); setError(""); }}
                placeholder="e.g. 28"
                className="rounded-2xl text-base py-5"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-secondary">gender *</Label>
              <Select value={gender || undefined} onValueChange={(v) => { setGender(v); setError(""); }}>
                <SelectTrigger className="rounded-2xl h-[50px]">
                  <SelectValue placeholder="select" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {GENDERS.map(g => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SMS Consent */}
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-2xl">
            <Checkbox
              id="sms-consent"
              checked={smsConsent}
              onCheckedChange={() => { setSmsConsent(v => !v); setError(""); }}
              className="mt-0.5 shrink-0"
            />
            <Label htmlFor="sms-consent" className="cursor-pointer text-xs text-green-800 leading-relaxed">
              I agree to receive automated transactional SMS messages from <strong>Cruise Kauaʻi</strong> (ride confirmations, reminders, booking notifications). Message &amp; data rates may apply. Reply <strong>STOP</strong> to unsubscribe. <a href="/sms-opt-in" className="text-green-700 underline" target="_blank">SMS Terms</a>.
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