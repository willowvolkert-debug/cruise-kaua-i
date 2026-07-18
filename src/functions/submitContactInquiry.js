import { base44 } from "@/api/base44Client";

export async function submitContactInquiry(payload) {
  return await base44.functions.invoke("submitContactInquiry", payload);
}