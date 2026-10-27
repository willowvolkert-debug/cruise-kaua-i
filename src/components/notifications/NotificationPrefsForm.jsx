import React from "react";
import { Switch } from "@/components/ui/switch";
import MultiChips from "@/components/notifications/MultiChips";
import { KAUAI_TOWNS, ISLAND_SIDES, RELIEF_KINDS } from "@/components/notifications/notificationOptions";

function Row({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3 p-3 rounded-2xl border border-border bg-card">
      <p className="font-heading text-lg text-secondary leading-none">{title}</p>
      {children}
    </div>
  );
}

export default function NotificationPrefsForm({ value, onChange, canText }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const ridesOn = value.sms_notify_posted_rides || value.sms_notify_ride_requests;

  return (
    <div className="space-y-3">
      {!canText && (
        <p className="text-xs text-muted-foreground bg-muted rounded-xl p-2.5 leading-relaxed">
          These are sent as text messages. Add your phone number and agree to texts in your account to receive them.
        </p>
      )}

      <Section title="rides">
        <Row label="text me when a ride is posted" checked={value.sms_notify_posted_rides} onChange={(v) => set({ sms_notify_posted_rides: v })} />
        <Row label="text me when a ride is requested" checked={value.sms_notify_ride_requests} onChange={(v) => set({ sms_notify_ride_requests: v })} />
        {ridesOn && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">which towns?</p>
            <MultiChips options={KAUAI_TOWNS} value={value.sms_preferred_locations} onChange={(v) => set({ sms_preferred_locations: v })} emptyMeansAll />
          </div>
        )}
      </Section>

      <Section title="grey skies (disaster relief)">
        <Row
          label="notify me about new posts"
          checked={value.notify_relief}
          onChange={(v) => set({ notify_relief: v, notify_relief_kinds: v && value.notify_relief_kinds.length === 0 ? RELIEF_KINDS.map((k) => k.value) : value.notify_relief_kinds })}
        />
        {value.notify_relief && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">which kind?</p>
            <MultiChips options={RELIEF_KINDS} value={value.notify_relief_kinds} onChange={(v) => set({ notify_relief_kinds: v })} />
          </div>
        )}
      </Section>

      <Section title="road alerts">
        <Row
          label="notify me about new road alerts"
          checked={value.notify_road}
          onChange={(v) => set({ notify_road: v, notify_road_sides: v && value.notify_road_sides.length === 0 ? ISLAND_SIDES.map((s) => s.value) : value.notify_road_sides })}
        />
        {value.notify_road && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">which side of the island?</p>
            <MultiChips options={ISLAND_SIDES} value={value.notify_road_sides} onChange={(v) => set({ notify_road_sides: v })} />
          </div>
        )}
      </Section>
    </div>
  );
}