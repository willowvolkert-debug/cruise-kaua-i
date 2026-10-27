import { getIslandMap } from "@/lib/island";

export const geocode = async (q) => {
  const { viewbox, place } = getIslandMap();
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&bounded=1&viewbox=${viewbox}&q=${encodeURIComponent(q + ", " + place)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data[0] ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
};