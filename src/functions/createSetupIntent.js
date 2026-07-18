import { base44 } from "@/api/base44Client";

export async function createSetupIntent(payload) {
  return await base44.functions.invoke("createSetupIntent", payload);
}