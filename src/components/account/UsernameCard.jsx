import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function UsernameCard({ user, onComplete }) {
  const [username, setUsername] = useState(user?.username || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const clean = username.trim().replace(/^@/, "");

  const handleSubmit = async () => {
    if (clean.length < 2) { setError("Please enter at least 2 characters."); return; }
    setSaving(true);
    try {
      await base44.auth.updateMe({ username: clean });
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
        <div className="px-6 pt-10 pb-6 text-center text-white bg-primary">
          <div className="text-4xl mb-2">🤙</div>
          <h1 className="cruise-head text-4xl text-white">what should we call you?</h1>
          <p className="text-white/80 text-base mt-1">this is the name others will see on your profile and in texts</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-secondary">username *</Label>
            <Input
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              placeholder="e.g. kai"
              className="rounded-2xl text-base py-5"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-2xl p-3">{error}</p>
          )}
        </div>
        <div className="px-6 pb-6">
          <Button
            onClick={handleSubmit}
            disabled={saving || clean.length < 2}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-5 text-base font-bold shadow-lg"
          >
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> saving...</> : "continue →"}
          </Button>
        </div>
      </div>
    </div>
  );
}