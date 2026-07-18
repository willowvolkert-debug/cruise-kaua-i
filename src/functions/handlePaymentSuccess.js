import { base44 } from "@/api/base44Client";

export async function handlePaymentSuccess(payload) {
  return await base44.functions.invoke("handlePaymentSuccess", payload);
}