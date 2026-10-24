export const HAZARD_TYPES = [
  { key: "traffic", emoji: "🚗", label: "traffic jam", color: "#f59e0b" },
  { key: "crash", emoji: "💥", label: "crash", color: "#dc2626" },
  { key: "hazard", emoji: "⚠️", label: "road hazard", color: "#f97316" },
  { key: "closure", emoji: "🚧", label: "road closed", color: "#7c2d12" },
  { key: "flooding", emoji: "🌊", label: "flooding", color: "#2563eb" },
  { key: "animals", emoji: "🐓", label: "animals on road", color: "#16a34a" },
  { key: "stalled", emoji: "🛻", label: "stalled car", color: "#6b7280" },
  { key: "police", emoji: "🚔", label: "police", color: "#4f46e5" },
];

export const getHazardType = (key) => HAZARD_TYPES.find((t) => t.key === key) || HAZARD_TYPES[2];

// Reports stay on the map for this many hours
export const HAZARD_TTL_HOURS = 4;

export function timeAgo(dateStr) {
  const d = new Date(/Z|[+-]\d\d:?\d\d$/.test(dateStr) ? dateStr : dateStr + "Z");
  const mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}