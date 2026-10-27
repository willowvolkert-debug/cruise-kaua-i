export const geocode = async (q) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&bounded=1&viewbox=-159.85,22.25,-159.25,21.85&q=${encodeURIComponent(q + ", Kauai, Hawaii")}`;
  const res = await fetch(url);
  const data = await res.json();
  return data[0] ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
};