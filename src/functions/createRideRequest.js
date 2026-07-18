import { base44 } from "@/api/base44Client";

export async function createRideRequest(payload) {
  return await base44.functions.invoke("createRideRequest", payload);
}