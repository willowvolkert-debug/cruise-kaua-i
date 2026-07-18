import { base44 } from "@/api/base44Client";

export async function sendSmsNotification(payload) {
  return await base44.functions.invoke("sendSmsNotification", payload);
}