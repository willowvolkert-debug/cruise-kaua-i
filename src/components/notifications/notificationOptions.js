export const SIDE_TOWNS = {
  north: ["Haʻena", "Wainiha", "Hanalei", "Princeville", "Kilauea", "Moloaʻa", "Anahola"],
  east: ["Keālia", "Kapahi", "Kapaʻa", "Wailua", "Hanamaʻulu", "Līhuʻe", "Puhi"],
  south: ["Poʻipū", "Kōloa", "Lāwaʻi", "Kālāheo"],
  west: ["Hanapēpē", "ʻEleʻele", "Port Allen", "Waimea", "Kekaha"],
};

export const SIDE_LABELS = { north: "north shore", east: "east side", south: "south side", west: "west side" };

export const RELIEF_KINDS = [
  { value: "need", label: "needs" },
  { value: "resource", label: "resources" },
];

const norm = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[ʻ'’`]/g, "").toLowerCase().trim();

// Map older saved names (e.g. "Lihue") to the current spelling; drop unknown ones.
const canonical = (list) => {
  const all = Object.values(SIDE_TOWNS).flat();
  return (list || []).map((n) => all.find((t) => norm(t) === norm(n))).filter(Boolean);
};

export const prefsFromUser = (user) => {
  const legacyRoad = (user?.notify_road_sides || []).flatMap((s) => SIDE_TOWNS[s] || []);
  const road = user?.notify_road_locations?.length ? user.notify_road_locations : legacyRoad;
  return {
    sms_notify_posted_rides: user?.sms_notify_posted_rides !== false,
    sms_notify_ride_requests: user?.sms_notify_ride_requests !== false,
    sms_preferred_locations: canonical(user?.sms_preferred_locations),
    notify_relief: !!user?.notify_relief,
    notify_relief_kinds: user?.notify_relief_kinds || [],
    notify_relief_locations: canonical(user?.notify_relief_locations),
    notify_road: !!user?.notify_road,
    notify_road_locations: canonical(road),
    notify_road_sides: [], // retired: towns are stored instead
  };
};