import { base44 } from "@/api/base44Client";

export async function checkConnectStatus(payload) {
  return await base44.functions.invoke("checkConnectStatus", payload);
}