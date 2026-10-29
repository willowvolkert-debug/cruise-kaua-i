// Matches foodpool requests with carpool rides (same date, same towns).
const norm = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[ʻ'’`]/g, "").replace(/\s+/g, " ").trim();

const mentionsTown = (town, text) => !!town && norm(text).includes(norm(town));

// 0 = no match, 1 = one end of the delivery is on the ride's route, 2 = both ends are.
export function matchScore(request, ride) {
  if (request.needed_date !== ride.departure_date) return 0;
  const places = [ride.departure_location, ride.destination, ...(ride.stops || [])].join(" | ");
  return (mentionsTown(request.pickup_location, places) ? 1 : 0) + (mentionsTown(request.dropoff_location, places) ? 1 : 0);
}

export const ridesForRequest = (request, rides) =>
  rides.filter((r) => r.driver_id !== request.requester_id && matchScore(request, r) > 0)
    .sort((a, b) => matchScore(request, b) - matchScore(request, a));

export const requestsForRides = (requests, rides) =>
  requests.filter((q) => rides.some((r) => matchScore(q, r) > 0));