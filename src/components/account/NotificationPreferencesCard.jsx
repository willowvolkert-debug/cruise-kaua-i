import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Loader2, Check } from "lucide-react";
import NotificationPrefsForm from "@/components/notifications/NotificationPrefsForm";
import { prefsFromUser } from "@/components/notifications/notificationOptions";

export default function NotificationPreferencesCard({ user, onUserUpdate }) {
  const [prefs, setPrefs] = useState(prefsFromUser(user));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setPrefs(prefsFromUser(user)); }, [user]);

  const change = (next) => { setSaved(false); setPrefs(next); };

  const save = async () => {
    setSaving(true);
    const updated = await base44.auth.updateMe({ ...prefs, notification_prefs_set: true });
    onUserUpdate?.(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-secondary flex items-center gap-2">
          <Bell className="w-4 h-4" /> notification preferences
        </CardTitle>
        <p className="text-xs text-gray-500 mt-1">Choose what you get texted about and where.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <NotificationPrefsForm value={prefs} onChange={change} canText={!!user?.sms_notifications_enabled && !!user?.phone_number} />
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} save preferences
          </button>
          {saved && <span className="text-sm text-green-600 font-medium flex items-center gap-1"><Check className="w-4 h-4" /> saved!</span>}
        </div>
      </CardContent>
    </Card>
  );
}