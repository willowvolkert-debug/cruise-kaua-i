import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2, Check } from "lucide-react";

const KAUAI_LOCATIONS = [
  "Hanalei", "Princeville", "Kilauea", "Kapaa", "Wailua", "Lihue",
  "Koloa", "Poipu", "Kalaheo", "Hanapepe", "Waimea", "Kekaha",
  "Anahola", "Eleʻele", "Lawai", "Puhi", "Wainiha", "Haena"
];

export default function SmsLocationPreferences({ user, onUserUpdate }) {
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSelected(user?.sms_preferred_locations || []);
  }, [user?.sms_preferred_locations]);

  const toggleLocation = (loc) => {
    setSaved(false);
    setSelected(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await base44.auth.updateMe({ sms_preferred_locations: selected });
      onUserUpdate?.(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error("Error saving SMS location preferences:", e);
    }
    setSaving(false);
  };

  if (!user?.sms_notifications_enabled) return null;

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-secondary flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          text alert locations
        </CardTitle>
        <p className="text-xs text-gray-500 mt-1">
          Choose which towns you want to receive ride text alerts for. Leave all unchecked to get alerts for every location.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {KAUAI_LOCATIONS.map(loc => {
            const isSelected = selected.includes(loc);
            return (
              <button
                key={loc}
                type="button"
                onClick={() => toggleLocation(loc)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-white text-gray-600 border border-gray-300 hover:border-green-400"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                {loc}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            save preferences
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <Check className="w-4 h-4" /> saved!
            </span>
          )}
          {selected.length > 0 && (
            <span className="text-xs text-gray-500">
              {selected.length} location{selected.length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}