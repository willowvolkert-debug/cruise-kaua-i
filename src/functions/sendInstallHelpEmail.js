import { base44 } from "@/api/base44Client";

export async function sendInstallHelpEmail(payload) {
  return await base44.functions.invoke("sendInstallHelpEmail", payload);
}