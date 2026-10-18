// Shared location matching utilities for zone-based proximity matching.
// Used by getPublicRides, ride-request matching, and driver notification
// functions to match nearby locations (e.g., "Lihue Airport" → "Lihue").

const LOCATION_ZONES: Record<string, string[]> = {
  // Kauaʻi zones
  'lihue': ['lihue', 'lihu', 'lihuʻe', 'airport', 'watumull', 'kukui grove', 'kukui', 'water department', 'nawiliwili', 'childrens theater', 'children\'s theater', 'melrose', 'rice shopping'],
  'hanalei': ['hanalei', 'hānalei', 'hanalei town', 'hanalei bay'],
  'kapaa': ['kapaa', 'kapaʻa', 'kapa\'a', 'wailua', 'wailua homesteads', 'kapahi'],
  'princeville': ['princeville', 'ali\'i kai', 'alii kai', 'wailea'],
  'kilauea': ['kilauea', 'kīlauea', 'kilauea town'],
  'hanapepe': ['hanapepe', 'hanapēpē', 'hanapepe public library', 'hanapepe town'],
  'waimea': ['waimea', 'waimea town', 'waimea canyon'],
  'koloa': ['koloa', 'kōloa', 'poipu', 'poʻipu', 'po\'ipu', 'shipwreck beach'],
  'haena': ['haena', 'hāʻena', 'haena state park', 'haʻena state park'],
  'wainiha': ['wainiha'],
  'anahola': ['anahola'],
  'eleele': ['eleele', 'ʻeleʻele', 'elele'],
  'kalaheo': ['kalaheo', 'kalāheō', 'kalaheō'],
  'omao': ['omao', 'ōmaʻo', 'omaʻo'],
  // Oʻahu zones
  'honolulu': ['honolulu', 'waikiki', 'waikīkī', 'downtown', 'manoa', 'aloha tower', 'ala moana'],
  'airport_oahu': ['airport', 'hnl', 'honolulu airport', 'daniel k inouye'],
  'pearl city': ['pearl city', 'aiea', 'pearl harbor', 'pearlridge', 'awa'],
  'kailua_oahu': ['kailua', 'kailua town', 'lanikai'],
  'kaneohe': ['kaneohe', 'kāneʻohe', 'kailua bay'],
  'kapolei': ['kapolei', 'ewa beach', 'ewa', 'ko olina'],
  'haleiwa': ['haleiwa', 'haleʻiwa', 'north shore', 'waialua'],
  // Maui zones
  'kahului': ['kahului', 'kahului airport', 'ogc', 'maui mall'],
  'lahaina': ['lahaina', 'lāhainā', 'kaanapali', 'kaʻanapali', 'napili', 'kapalua'],
  'kihei': ['kihei', 'kīhei', 'wailea', 'makena'],
  'wailuku': ['wailuku', 'īao', 'iao valley'],
  // Big Island zones
  'kona': ['kona', 'kailua-kona', 'kailua kona', 'captain cook', 'holualoa', 'keahole'],
  'hilo': ['hilo', 'hilo airport', 'downtown hilo', 'keaau', 'keaʻau'],
  'waimea_bi': ['waimea', 'waimea town', 'kohala', 'hawi'],
};

export function normalizeLocation(loc: string): string {
  return (loc || '').toLowerCase().trim()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9\s'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getZone(loc: string): string | null {
  const norm = normalizeLocation(loc);
  if (!norm) return null;
  for (const [zone, keywords] of Object.entries(LOCATION_ZONES)) {
    for (const kw of keywords) {
      if (norm === kw || norm.includes(kw)) return zone;
    }
  }
  return null;
}

// Two locations match if they're in the same zone, or if one string
// includes the other (handles "Lihue Airport" matching "Lihue").
export function locationsMatch(loc1: string, loc2: string): boolean {
  const n1 = normalizeLocation(loc1);
  const n2 = normalizeLocation(loc2);
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;
  const z1 = getZone(loc1);
  const z2 = getZone(loc2);
  if (z1 && z2 && z1 === z2) return true;
  return false;
}

// Check if a ride route matches a rider's requested route.
// Matches if departure→departure and destination→destination both match
// (using zone matching), OR if either direction matches (for partial rides).
export function routeMatches(
  rideDeparture: string, rideDestination: string,
  requestDeparture: string, requestDestination: string
): boolean {
  const depMatch = locationsMatch(rideDeparture, requestDeparture);
  const destMatch = locationsMatch(rideDestination, requestDestination);
  if (depMatch && destMatch) return true;
  // Also check reverse direction (rider going A→B, driver going B→A)
  const reverseDepMatch = locationsMatch(rideDeparture, requestDestination);
  const reverseDestMatch = locationsMatch(rideDestination, requestDeparture);
  if (reverseDepMatch && reverseDestMatch) return true;
  return false;
}