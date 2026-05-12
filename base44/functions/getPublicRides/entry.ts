import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { start_date, end_date, island } = body;

    const ISLAND_KEYWORDS = {
      Kauai: ['kauai', 'kauaʻi', 'lihue', 'hanalei', 'poipu', 'waimea', 'kapaa', 'princeville', 'kilauea', 'koloa', 'hanapepe', 'eleele', 'kalaheo', 'haena', 'anahola', 'nawiliwili'],
      Oahu: ['oahu', 'oʻahu', 'honolulu', 'waikiki', 'kailua', 'kaneohe', 'pearl city', 'ewa', 'aiea', 'haleiwa', 'mililani', 'waipahu', 'kapolei', 'hawaii kai', 'manoa', 'nuuanu', 'pali', 'waimanalo'],
      Maui: ['maui', 'lahaina', 'kihei', 'kahului', 'paia', 'hana', 'wailea', 'makawao', 'haiku', 'wailuku', 'napili', 'kapalua', 'kaanapali'],
      'Big Island': ['big island', 'hawaii island', 'hilo', 'kona', 'waimea', 'pahoa', 'captain cook', 'holualoa', 'keaau', 'volcano', 'naalehu', 'kalapana'],
    };

    const allRides = await base44.asServiceRole.entities.Ride.list("-departure_date");
    const filtered = allRides.filter(r => {
      if (r.status !== 'active') return false;
      if (start_date && r.departure_date < start_date) return false;
      if (end_date && r.departure_date > end_date) return false;
      if (island && ISLAND_KEYWORDS[island]) {
        const keywords = ISLAND_KEYWORDS[island];
        const dep = (r.departure_location || '').toLowerCase();
        const dest = (r.destination || '').toLowerCase();
        const matchesDep = keywords.some(k => dep.includes(k));
        const matchesDest = keywords.some(k => dest.includes(k));
        if (!matchesDep && !matchesDest) return false;
      }
      return true;
    });

    return Response.json({ rides: filtered });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});