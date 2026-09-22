import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { email, name } = await req.json().catch(() => ({}));

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Save to LaunchSignup for tracking
    try {
      await base44.asServiceRole.entities.LaunchSignup.create({ email, name: name || undefined });
    } catch (e) { /* non-critical - might be duplicate */ }

    // Invite as user so they're in the user database for future newsletters
    try {
      await base44.asServiceRole.users.inviteUser(email, 'user');
    } catch (e) { /* might already exist or unsupported on service role */ }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}