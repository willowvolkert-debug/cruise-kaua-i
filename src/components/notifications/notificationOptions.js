export const KAUAI_TOWNS = [
  "Hanalei", "Princeville", "Kilauea", "Kapaa", "Wailua", "Lihue",
  "Koloa", "Poipu", "Kalaheo", "Hanapepe", "Waimea", "Kekaha",
  "Anahola", "Eleʻele", "Lawai", "Puhi", "Wainiha", "Haena",
];

export const ISLAND_SIDES = [
  { value: "north", label: "north" },
  { value: "east", label: "east" },
  { value: "south", label: "south" },
  { value: "west", label: "west" },
];

export const RELIEF_KINDS = [
  { value: "need", label: "needs" },
  { value: "resource", label: "resources" },
];

export const DEFAULT_PREFS = {
  sms_notify_posted_rides: true,
  sms_notify_ride_requests: true,
  sms_preferred_locations: [],
  notify_relief: false,
  notify_relief_kinds: [],
  notify_road: false,
  notify_road_sides: [],
};

export const prefsFromUser = (user) => ({
  sms_notify_posted_rides: user?.sms_notify_posted_rides !== false,
  sms_notify_ride_requests: user?.sms_notify_ride_requests !== false,
  sms_preferred_locations: user?.sms_preferred_locations || [],
  notify_relief: !!user?.notify_relief,
  notify_relief_kinds: user?.notify_relief_kinds || [],
  notify_road: !!user?.notify_road,
  notify_road_sides: user?.notify_road_sides || [],
});