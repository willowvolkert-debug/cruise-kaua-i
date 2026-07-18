import { base44 } from "@/api/base44Client";

export async function sendWelcomeEmail(payload) {
  return await base44.functions.invoke("sendWelcomeEmail", payload);
}