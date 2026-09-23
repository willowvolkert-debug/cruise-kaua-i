import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { email, name } = await req.json().catch(() => ({}));

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Save to LaunchSignup — these emails are included in newsletter blasts
    // via getNewsletterRecipients() shared helper used by blast functions
    await base44.asServiceRole.entities.LaunchSignup.create({ email, name: name || undefined });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}