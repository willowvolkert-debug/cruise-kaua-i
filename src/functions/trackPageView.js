import { base44 } from "@/api/base44Client";

export async function trackPageView(payload) {
  return await base44.functions.invoke("trackPageView", payload);
}