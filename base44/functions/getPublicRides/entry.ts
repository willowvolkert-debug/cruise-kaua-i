import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ISLAND_KEYWORDS = {
  Kauai: ['kauai', 'kauaʻi', 'lihue', 'hanalei', 'kapaa', 'kapaʻa', 'poipu', 'poʻipu', 'waimea', 'princeville', 'kilauea', 'anahola', 'koloa', 'eleele', 'hanapepe', 'lawai', 'kalaheo', 'haena', 'hāʻena'],
  Oahu: ['oahu', 'oʻahu', 'honolulu', 'waikiki', 'pearl city', 'aiea', 'kailua', 'kaneohe', 'kapolei', 'ewa beach', 'mililani', 'waipahu', 'pearl harbor', 'haleiwa', 'north shore', 'manoa', 'waimanalo', 'hawaii kai'],
  Maui: ['maui', 'kahului', 'lahaina', 'kihei', 'wailea', 'paia', 'haiku', 'makawao', 'wailuku', 'hana', 'kapalua', 'napili', 'kaanapali', 'pukalani'],
  'Big Island': ['big island', 'hilo', 'kona', 'waimea', 'kohala', 'volcano', 'pahoa', 'keaau', 'captain cook', 'naalehu', 'holualoa', 'kailua-kona'],
};

function rideMatchesIsland(ride, island) {
  if (!island) return true;
  const keywords = ISLAND_KEYWORDS[island] || [];
  const text = `${ride.departure_location} ${ride.destination} ${(ride.stops || []).join(' ')}`.toLowerCase();
  return keywords.some(kw => text.includes(kw));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { start_date, end_date, island } = body;

    const allRides = await base44.asServiceRole.entities.Ride.list("-departure_date");
    const filtered = allRides.filter(r => {
      if (r.status !== 'active') return false;
      if (start_date && r.departure_date < start_date) return false;
      if (end_date && r.departure_date > end_date) return false;
      if (island) {
        // If ride has explicit island field, use it directly; otherwise fall back to keyword matching
        if (r.island) {
          if (r.island !== island) return false;
        } else {
          if (!rideMatchesIsland(r, island)) return false;
        }
      }
      return true;
    });

    return Response.json({ rides: filtered });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});