import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Public endpoint called during signup (before the user is authenticated).
// Checks whether an email already exists as a User record in the Users list.
// Returns { exists, is_verified } so the signup flow can decide:
//   - exists + verified  → prompt login (account fully set up)
//   - exists + unverified→ prompt login (account created but not verified)
//   - !exists            → email is new OR was deleted by an admin → allow fresh registration
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body?.email || "").trim().toLowerCase();
    if (!email) return Response.json({ error: "email is required" }, { status: 400 });

    const base44 = createClientFromRequest(req);
    // Service role: the caller is not authenticated yet (signup flow), so we
    // must query the full Users list regardless of RLS.
    const users = await base44.asServiceRole.entities.User.filter({ email });
    const exists = Array.isArray(users) && users.length > 0;
    const is_verified = exists ? !!users[0].is_verified : false;
    return Response.json({ exists, is_verified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}