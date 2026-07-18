import { base44 } from "@/api/base44Client";

export async function sendAdminMessage(payload) {
  return await base44.functions.invoke("sendAdminMessage", payload);
}