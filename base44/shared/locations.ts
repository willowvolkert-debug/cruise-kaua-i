// Kauaʻi location groups used by every notification feature.
export const SIDE_TOWNS: Record<string, string[]> = {
  north: ['Haʻena', 'Wainiha', 'Hanalei', 'Princeville', 'Kilauea', 'Moloaʻa', 'Anahola'],
  east: ['Keālia', 'Kapahi', 'Kapaʻa', 'Wailua', 'Hanamaʻulu', 'Līhuʻe', 'Puhi'],
  south: ['Poʻipū', 'Kōloa', 'Lāwaʻi', 'Kālāheo'],
  west: ['Hanapēpē', 'ʻEleʻele', 'Port Allen', 'Waimea', 'Kekaha'],
};

export const norm = (s: string) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[ʻ'’`]/g, '').toLowerCase().trim();

const ALL_TOWNS = Object.values(SIDE_TOWNS).flat();
const SIDE_OF: Record<string, string> = {};
for (const [side, towns] of Object.entries(SIDE_TOWNS)) for (const t of towns) SIDE_OF[norm(t)] = side;

// Does an item at `texts` (place names) match the user's chosen towns?
// Empty prefs = all of Kauaʻi. If no known town is named, falls back to `side` (from coordinates).
export function matchesLocation(prefs: string[] | undefined, texts: string[], side?: string | null): boolean {
  if (!prefs || prefs.length === 0) return true;
  const hay = texts.map(norm).join(' | ');
  const wanted = prefs.map(norm);
  const mentioned = ALL_TOWNS.map(norm).filter((t) => hay.includes(t));
  if (mentioned.length) return mentioned.some((t) => wanted.includes(t));
  if (wanted.some((p) => hay.includes(p))) return true;
  return !!side && wanted.some((p) => SIDE_OF[p] === side);
}