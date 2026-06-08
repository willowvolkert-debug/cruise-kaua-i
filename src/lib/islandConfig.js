/**
 * Detects the current island based on the hostname.
 * cruisekauai.org / cruisekauai → Kauai
 * cruiseoahu.org  / cruiseoahu  → Oahu
 * cruisemaui.org  / cruisemaui  → Maui
 * Default (dev/unknown)         → Kauai
 */
export function getIslandFromDomain() {
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('cruiseoahu') || hostname.includes('oahu')) return 'Oahu';
  if (hostname.includes('cruisemaui') || hostname.includes('maui')) return 'Maui';
  if (hostname.includes('cruisebigisland') || hostname.includes('bigisland')) return 'Big Island';
  // Default / cruisekauai / preview
  return 'Kauai';
}

export const ISLAND_CONFIG = {
  Kauai: {
    name: "Kauaʻi",
    appName: "cruise hawaiʻi",
    islandSubtitle: "kauaʻi",
    domain: "cruisekauai.org",
    heroImage: "https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?w=1200&q=80",
    visitingDesc: "Get around with Cruise Kauaʻi & The Hanalei Initiative Shuttles in Kapaʻa, Princeville, Hanalei & Hāʻena.",
    trafficDesc: "traffic on kauaʻi",
    sidebarLabel: "cruise hawaiʻi",
  },
  Oahu: {
    name: "Oʻahu",
    appName: "cruise hawaiʻi",
    islandSubtitle: "oʻahu",
    domain: "cruiseoahu.org",
    heroImage: "https://images.unsplash.com/photo-1721357555154-789c11332b58?w=1200&q=80",
    heroSubtitle: "a community-based ridesharing app to reduce traffic on oʻahu",
    visitingDesc: "Get around with Cruise Oʻahu as an alternative to rental cars and traffic.",
    trafficDesc: "traffic on oʻahu",
    sidebarLabel: "cruise hawaiʻi",
    showTransportOptions: true,
    driverCardTitle: "Are you local?",
    driverCardDesc: "We're actively looking for local Oʻahu drivers to join the platform. Help your community get around — post rides on trips you're already making and earn extra income.",
    riderCardDesc: "Browse rides from local drivers heading your way across Oʻahu. Affordable, local, and community-driven.",
  },
  Maui: {
    name: "Maui",
    appName: "cruise hawaiʻi",
    islandSubtitle: "maui",
    domain: "cruisemaui.org",
    heroImage: "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=1200&q=80",
    visitingDesc: "Get around with Cruise Maui as an affordable alternative to car rentals.",
    trafficDesc: "traffic on maui",
    sidebarLabel: "cruise hawaiʻi",
  },
  "Big Island": {
    name: "Big Island",
    appName: "cruise hawaiʻi",
    islandSubtitle: "hawaiʻi island",
    domain: "cruisebigisland.org",
    heroImage: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80",
    visitingDesc: "Get around the Big Island affordably with Cruise Big Island.",
    trafficDesc: "traffic on the big island",
    sidebarLabel: "cruise hawaiʻi",
  },
};