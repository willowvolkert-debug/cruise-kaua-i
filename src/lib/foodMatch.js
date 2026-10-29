// Matches foodpool requests with carpool rides (same date, towns on the ride's route).
import { SIDE_TOWNS } from "@/components/notifications/notificationOptions";

const norm = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[ʻ'’`]/g, "").replace(/\s+/g, " ").trim();

// Towns in order around the island (north → east → south → west).
const ROUTE = Object.values(SIDE_TOWNS).flat();
const indexOfTown = (town) => ROUTE.findIndex((t) => norm(t) === norm(town));

// The span of towns a ride covers: from its furthest-back to furthest-forward town (start, stops, end).
function rideSpan(ride) {
  const text = norm([ride.departure_location, ride.destination, ...(ride.stops || [])].join(" | "));
  const idx = ROUTE.map((t, i) => (text.includes(norm(t)) ? i : -1)).filter((i) => i >= 0);
  return idx.length ? [Math.min(...idx), Math.max(...idx)] : null;
}

const onRoute = (town, span) => {
  const i = indexOfTown(town);
  return span && i >= 0 && i >= span[0] && i <= span[1];
};

// 0 = no match, 1 = one end of the delivery is on the ride's route, 2 = both ends are.
export function matchScore(request, ride) {
  if (request.needed_date !== ride.departure_date) return 0;
  const span = rideSpan(ride);
  return (onRoute(request.pickup_location, span) ? 1 : 0) + (onRoute(request.dropoff_location, span) ? 1 : 0);
}

export const ridesForRequest = (request, rides) =>
  rides.filter((r) => r.driver_id !== request.requester_id && matchScore(request, r) > 0)
    .sort((a, b) => matchScore(request, b) - matchScore(request, a));

export const requestsForRides = (requests, rides) =>
  requests.filter((q) => rides.some((r) => matchScore(q, r) > 0));