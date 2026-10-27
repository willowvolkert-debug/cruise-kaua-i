import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Loader2, Check, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NotificationPrefsForm from "@/components/notifications/NotificationPrefsForm";
import { prefsFromUser } from "@/components/notifications/notificationOptions";

export default function NotificationPreferencesCard({ user, onUserUpdate }) {
  const [open, setOpen] = useState(false);
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

  const changeFrequency = async (v) => {
    const updated = await base44.auth.updateMe({ email_update_frequency: v });
    onUserUpdate?.(updated);
  };

  return (
    <div className="border-b-2 border-gray-200 pb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 select-none"
      >
        <span className="flex items-center gap-2 text-2xl font-heading text-secondary">
          <Bell className="w-6 h-6" /> notification settings
        </span>
        <ChevronDown className={`w-6 h-6 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-5 pb-4">
          <p className="text-base text-gray-500">Choose what you get texted about and where.</p>
          <NotificationPrefsForm value={prefs} onChange={change} canText={!!user?.sms_notifications_enabled && !!user?.phone_number} />
          <div className="space-y-2">
            <p className="text-lg font-bold text-gray-800">✉️ email frequency with updated rides</p>
            <Select value={user?.email_update_frequency || "daily"} onValueChange={changeFrequency}>
              <SelectTrigger className="h-16 text-lg rounded-lg border-2 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">daily</SelectItem>
                <SelectItem value="every_3_days">every 3 days</SelectItem>
                <SelectItem value="weekly">weekly</SelectItem>
                <SelectItem value="monthly">monthly</SelectItem>
                <SelectItem value="never">please don't send me any emails</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="w-full h-14 rounded-lg bg-primary text-primary-foreground text-lg font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 select-none"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} save preferences
            </button>
          </div>
          {saved && <span className="text-sm text-green-600 font-medium flex items-center gap-1"><Check className="w-4 h-4" /> saved!</span>}
        </div>
      )}
    </div>
  );
}