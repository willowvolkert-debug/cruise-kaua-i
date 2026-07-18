import { base44 } from "@/api/base44Client";

export async function sendUserLifecycleEmail(payload) {
  return await base44.functions.invoke("sendUserLifecycleEmail", payload);
}