import { base44 } from "@/api/base44Client";

export async function sendWelcomeSms(payload) {
  return await base44.functions.invoke("sendWelcomeSms", payload);
}