import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ISLAND_KEYWORDS = {
  Kauai: ['kauai', 'kauaʻi', 'lihue', 'hanalei', 'kapaa', 'kapaʻa', 'poipu', 'poʻipu', 'waimea', 'princeville', 'kilauea', 'anahola', 'koloa', 'eleele', 'hanapepe', 'lawai', 'kalaheo', 'haena', 'hāʻena', 'wailua', 'wainiha', 'kapahi', 'omao', 'kalaheo', 'kalāheo'],
  Oahu: ['oahu', 'oʻahu', 'honolulu', 'waikiki', 'pearl city', 'aiea', 'kailua', 'kaneohe', 'kapolei', 'ewa beach', 'mililani', 'waipahu', 'pearl harbor', 'haleiwa', 'north shore', 'manoa', 'waimanalo', 'hawaii kai'],
  Maui: ['maui', 'kahului', 'lahaina', 'kihei', 'wailea', 'paia', 'haiku', 'makawao', 'wailuku', 'hana', 'kapalua', 'napili', 'kaanapali', 'pukalani'],
  'Big Island': ['big island', 'hilo', 'kona', 'waimea', 'kohala', 'volcano', 'pahoa', 'keaau', 'captain cook', 'naalehu', 'holualoa', 'kailua-kona'],
};

// Zone-based location matching: groups nearby locations so that
// "Lihue Airport" matches "Lihue", "Watumull Plaza", "Kukui Grove", etc.
// This is the #1 fix for the route-matching problem — riders searching
// "Lihue Airport" were seeing zero rides even when 115 went to Lihue.
const LOCATION_ZONES: Record<string, string[]> = {
  // Kauaʻi zones
  'lihue': ['lihue', 'lihu', 'lihuʻe', 'airport', 'watumull', 'kukui grove', 'kukui', 'water department', 'nawiliwili', 'childrens theater', 'children\'s theater', 'melrose', 'rice shopping'],
  'hanalei': ['hanalei', 'hānalei', 'hanalei town', 'hanalei bay'],
  'kapaa': ['kapaa', 'kapaʻa', 'kapa\'a', 'wailua', 'wailua homesteads', 'kapahi', 'kapaʻa'],
  'princeville': ['princeville', 'princeville', 'ali\'i kai', 'alii kai', 'wailea'],
  'kilauea': ['kilauea', 'kīlauea', 'kilauea town'],
  'hanapepe': ['hanapepe', 'hanapēpē', 'hanapepe public library', 'hanapepe town'],
  'waimea': ['waimea', 'waimea town', 'waimea canyon'],
  'koloa': ['koloa', 'kōloa', 'poipu', 'poʻipu', 'po\'ipu', 'shipwreck beach'],
  'haena': ['haena', 'hāʻena', 'haena state park', 'haʻena state park'],
  'wainiha': ['wainiha', 'wainiha'],
  'anahola': ['anahola', 'anahola'],
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
  'wailuku': ['wailuku', 'īao', 'iao valley', 'kahului'],
  // Big Island zones
  'kona': ['kona', 'kailua-kona', 'kailua kona', 'captain cook', 'holualoa', 'keahole'],
  'hilo': ['hilo', 'hilo airport', 'downtown hilo', 'keaau', 'keaʻau'],
  'waimea_bi': ['waimea', 'waimea town', 'kohala', 'hawi'],
};

function normalizeLocation(loc: string): string {
  return (loc || '').toLowerCase().trim().replace(/['']/g, "'").replace(/[^a-z0-9\s'-]/g, '').replace(/\s+/g, ' ').trim();
}

function getZone(loc: string): string | null {
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
function locationsMatch(loc1: string, loc2: string): boolean {
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

function rideMatchesIsland(ride, island) {
  if (!island) return true;
  // If ride has explicit island field, use it directly
  if (ride.island) return ride.island === island;
  const keywords = ISLAND_KEYWORDS[island] || [];
  const text = `${ride.departure_location} ${ride.destination} ${(ride.stops || []).join(' ')}`.toLowerCase();
  return keywords.some(kw => text.includes(kw));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { start_date, end_date, island } = body;

    // Use server-side filtering for status and date range instead of
    // loading every ride in the database and filtering in memory.
    const dateQuery: any = { status: 'active' };
    if (start_date) dateQuery.departure_date = { ...dateQuery.departure_date, $gte: start_date };
    if (end_date) dateQuery.departure_date = { ...dateQuery.departure_date, $lte: end_date };

    const allRides = await base44.asServiceRole.entities.Ride.filter(dateQuery, { sort: '-departure_date', limit: 500 });
    const rides = Array.isArray(allRides) ? allRides : (allRides.items || []);

    const filtered = rides.filter(r => {
      if (island) {
        if (!rideMatchesIsland(r, island)) return false;
      }
      return true;
    });

    return Response.json({ rides: filtered });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});