// Frontend wrapper for the checkEmailExists backend function.
// Returns { exists, is_verified } — whether the email is already a User record.
import { base44 } from "@/api/base44Client";

export async function checkEmailExists({ email }) {
  const res = await base44.functions.invoke("checkEmailExists", { email });
  return res.data;
}