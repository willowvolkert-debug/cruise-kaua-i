import { base44 } from "@/api/base44Client";

export async function getPublicRides(payload) {
  return await base44.functions.invoke("getPublicRides", payload);
}