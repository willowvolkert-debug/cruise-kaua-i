import { base44 } from "@/api/base44Client";

export async function confirmRecurringRide(payload) {
  return await base44.functions.invoke("confirmRecurringRide", payload);
}