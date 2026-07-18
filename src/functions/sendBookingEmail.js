import { base44 } from "@/api/base44Client";

export async function sendBookingEmail(payload) {
  return await base44.functions.invoke("sendBookingEmail", payload);
}