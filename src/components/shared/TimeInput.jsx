import React from "react";
import { Input } from "@/components/ui/input";

// Converts app format "9:00 AM" → native "09:00" for <input type="time">
const toTimeValue = (timeStr) => {
  if (!timeStr) return "";
  const cleaned = String(timeStr).replace(/\s*(AM|PM)$/i, "").trim();
  const match = cleaned.match(/(\d+):(\d+)/);
  if (!match) return "";
  let h = parseInt(match[1]);
  const m = match[2];
  const period = (String(timeStr).match(/\s*(AM|PM)$/i)?.[1] || "").toUpperCase();
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m}`;
};

// Converts native "09:00" → app format "9:00 AM"
const fromTimeValue = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
};

/**
 * Native time picker — uses <input type="time"> which gives iOS/Android
 * a native time wheel. Converts between native HH:MM and the app's
 * "h:mm AM/PM" storage format automatically.
 */
export default function TimeInput({ value, onChange, className, id, required, ...props }) {
  return (
    <Input
      id={id}
      type="time"
      value={toTimeValue(value)}
      onChange={(e) => onChange(fromTimeValue(e.target.value))}
      className={className}
      required={required}
      {...props}
    />
  );
}