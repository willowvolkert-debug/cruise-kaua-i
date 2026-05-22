// Kauai location zones along the highway (roughly west to east/north)
// Distance in miles along Kuhio Highway from Kekaha (west end)
const LOCATION_MILES = {
  kekaha: 0,
  waimea: 4,
  hanapepe: 12,
  kalaheo: 17,
  poipu: 14,
  koloa: 16,
  lihue: 22,
  puhi: 20,
  kapaa: 32,
  wailua: 30,
  anahola: 38,
  kilauea: 46,
  princeville: 53,
  hanalei: 56,
  wainiha: 59,
  haena: 62,
  kokee: 19,
};

// Price caps per route segment (bidirectional)
// Format: { local: $, visitor: $ }
const ROUTE_CAPS = [
  { from: ["princeville", "hanalei"], to: ["lihue", "puhi", "koloa", "poipu", "hanapepe", "waimea", "kekaha", "kalaheo"], local: 25, visitor: 45 },
  { from: ["hanalei", "princeville"], to: ["kilauea", "anahola"], local: 10, visitor: 15 },
  { from: ["kilauea", "anahola"], to: ["kapaa", "wailua", "lihue", "puhi"], local: 20, visitor: 35 },
  { from: ["kapaa", "wailua"], to: ["lihue", "puhi", "koloa", "poipu", "hanapepe", "waimea", "kekaha", "kalaheo"], local: 15, visitor: 25 },
  { from: ["lihue", "puhi"], to: ["hanapepe", "waimea", "kekaha", "kalaheo", "koloa", "poipu"], local: 12, visitor: 20 },
];

const normalize = (loc) => {
  if (!loc) return "";
  return loc.toLowerCase()
    .replace(/[ʻ''`]/g, "'")
    .replace(/[āáà]/g, "a")
    .replace(/[ēéè]/g, "e")
    .replace(/[īíì]/g, "i")
    .replace(/[ōóò]/g, "o")
    .replace(/[ūúù]/g, "u")
    .replace(/,.*/, "") // strip ", Kauai" etc.
    .trim();
};

const matchZone = (loc) => {
  const n = normalize(loc);
  for (const key of Object.keys(LOCATION_MILES)) {
    if (n.includes(key) || key.includes(n)) return key;
  }
  return null;
};

const getMiles = (loc) => {
  const zone = matchZone(loc);
  return zone ? LOCATION_MILES[zone] : null;
};

// IRS business mileage rate (2025) — cost-sharing above this may trigger TNC/commercial classification
const IRS_BUSINESS_RATE = 0.725;

// Base rate: $0.35/mile for wear & tear + $0.15/mile for time/gas = $0.50/mile
const RATE_PER_MILE_LOCAL = 0.50;
const RATE_PER_MILE_VISITOR = 0.85;
const BASE_FEE = 3; // base fee regardless of distance

export function suggestPrice(from, to) {
  const fromMiles = getMiles(from);
  const toMiles = getMiles(to);

  if (fromMiles === null || toMiles === null) return null;

  const distance = Math.abs(fromMiles - toMiles);
  if (distance === 0) return null;

  const suggestedLocal = Math.round(BASE_FEE + distance * RATE_PER_MILE_LOCAL);
  const suggestedVisitor = Math.round(BASE_FEE + distance * RATE_PER_MILE_VISITOR);

  return {
    local: suggestedLocal,
    visitor: suggestedVisitor,
    distance: Math.round(distance),
  };
}

export function getRouteCap(from, to) {
  const fromZone = matchZone(from);
  const toZone = matchZone(to);
  if (!fromZone || !toZone) return null;

  for (const cap of ROUTE_CAPS) {
    const fromMatch = cap.from.some(z => fromZone.includes(z) || z.includes(fromZone));
    const toMatch = cap.to.some(z => toZone.includes(z) || z.includes(toZone));
    const reverseFromMatch = cap.to.some(z => fromZone.includes(z) || z.includes(fromZone));
    const reverseToMatch = cap.from.some(z => toZone.includes(z) || z.includes(toZone));

    if ((fromMatch && toMatch) || (reverseFromMatch && reverseToMatch)) {
      return { local: cap.local, visitor: cap.visitor };
    }
  }
  return null;
}

export function getPricingInfo(from, to) {
  const suggestion = suggestPrice(from, to);
  const routeCap = getRouteCap(from, to);

  // IRS business rate cap — always enforced as the legal ceiling
  let irsCap = null;
  if (suggestion) {
    irsCap = Math.round(suggestion.distance * IRS_BUSINESS_RATE);
  }

  // Use the lower of the hardcoded route cap or the IRS cap for locals
  // Visitors are capped at IRS rate too (they shouldn't exceed business rate either)
  const cap = routeCap
    ? {
        local: irsCap !== null ? Math.min(routeCap.local, irsCap) : routeCap.local,
        visitor: irsCap !== null ? Math.min(routeCap.visitor, irsCap) : routeCap.visitor,
      }
    : irsCap !== null
    ? { local: irsCap, visitor: irsCap }
    : null;

  // Ensure suggestion never exceeds the cap
  if (suggestion && cap) {
    suggestion.local = Math.min(suggestion.local, cap.local);
    suggestion.visitor = Math.min(suggestion.visitor, cap.visitor);
  }

  return { suggestion, cap };
}