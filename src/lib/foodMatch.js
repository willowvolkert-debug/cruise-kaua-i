// Matches foodpool requests with carpool rides (same date, shared place names).
const STOP = new Set(["street", "road", "highway", "hawaii", "kauai", "kauaʻi", "near", "the", "and", "drive", "avenue", "beach", "town"]);

const words = (s) =>
  (s || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));

const overlaps = (a, b) => {
  const set = new Set(words(a));
  return words(b).some((w) => set.has(w));
};

// 0 = no match, 1 = one end of the delivery is on the ride's route, 2 = both ends are.
export function matchScore(request, ride) {
  if (request.needed_date !== ride.departure_date) return 0;
  const places = [ride.departure_location, ride.destination, ...(ride.stops || [])].join(" ");
  return (overlaps(request.pickup_location, places) ? 1 : 0) + (overlaps(request.dropoff_location, places) ? 1 : 0);
}

export const ridesForRequest = (request, rides) =>
  rides.filter((r) => r.driver_id !== request.requester_id && matchScore(request, r) > 0)
    .sort((a, b) => matchScore(request, b) - matchScore(request, a));

export const requestsForRides = (requests, rides) =>
  requests.filter((q) => rides.some((r) => matchScore(q, r) > 0));