import { base44 } from "@/api/base44Client";

export async function deleteAccount() {
  return base44.functions.invoke("deleteAccount", {});
}