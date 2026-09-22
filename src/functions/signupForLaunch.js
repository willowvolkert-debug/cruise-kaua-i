import { base44 } from "@/api/base44Client";

export async function signupForLaunch(payload) {
  return await base44.functions.invoke("signupForLaunch", payload);
}