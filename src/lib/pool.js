// Shared helpers for schoolpool / partypool.
export const todayHST = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Pacific/Honolulu" });

export const RIDE_KINDS = {
  school: [
    { value: "to_school", label: "to school" },
    { value: "from_school", label: "home from school" },
  ],
  party: [
    { value: "sober_ride_home", label: "sober ride home from event" },
    { value: "to_event", label: "ride to event" },
  ],
};

export const kindLabel = (type, value) =>
  RIDE_KINDS[type]?.find((k) => k.value === value)?.label || "";

export const fmtDate = (d) =>
  d
    ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : "";

export const POOL_COPY = {
  school: {
    title: "schoolpool",
    emoji: "🎒",
    help: [
      "Search for your school. Only registered schools show up.",
      "Enter the school password (the school gives it to parents) to join.",
      "Don't see your school? Tap “register a school” in the top right.",
      "Once in, use get a ride, post a ride, inbox and confirmed rides to coordinate drop-offs and pick-ups with other parents.",
    ],
  },
  party: {
    title: "partypool",
    emoji: "🎉",
    help: [
      "Events on your island show up automatically. Tap “register an event” to add one.",
      "Tap an event, then use get a ride to find a safe ride home, or post a ride to offer one.",
      "Drivers offering a ride home pledge to stay sober.",
      "Use the inbox to confirm riders and message each other.",
    ],
  },
};