import { base44 } from "@/api/base44Client";

export async function messageRideRequester(payload) {
  return await base44.functions.invoke("messageRideRequester", payload);
}