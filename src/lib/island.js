import { getIslandFromDomain } from "@/lib/islandConfig";

const KEY = "cruise_island";

// Each island is its own silo: its own map, rides, alerts and stats.
export const ISLAND_MAP = {
  Kauai: { label: "Kauaʻi", center: [22.05, -159.5], zoom: 10, viewbox: "-159.85,22.25,-159.25,21.85", place: "Kauai, Hawaii" },
  Oahu: { label: "Oʻahu", center: [21.46, -157.98], zoom: 10, viewbox: "-158.35,21.75,-157.6,21.2", place: "Oahu, Hawaii" },
  Maui: { label: "Maui", center: [20.8, -156.33], zoom: 9, viewbox: "-156.75,21.05,-156.0,20.55", place: "Maui, Hawaii" },
  "Big Island": { label: "Big Island", center: [19.6, -155.5], zoom: 8, viewbox: "-156.1,20.3,-154.75,18.85", place: "Hawaii Island, Hawaii" },
};

export const ISLAND_KEYS = Object.keys(ISLAND_MAP);

export function getIsland() {
  const saved = localStorage.getItem(KEY);
  return ISLAND_MAP[saved] ? saved : getIslandFromDomain();
}

export function getIslandMap() {
  return ISLAND_MAP[getIsland()];
}

// Switching islands reloads the app on Home so nothing from the old island carries over.
export function switchIsland(island) {
  if (island === getIsland()) return;
  localStorage.setItem(KEY, island);
  window.location.assign("/home");
}