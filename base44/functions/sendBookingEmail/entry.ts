import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId, subject, body } = await req.json();

    const allUsers = await base44.asServiceRole.entities.User.list();
    const recipient = allUsers.find(u => u.id === userId);

    if (!recipient?.email) {
      return Response.json({ ok: false, reason: 'User not found or no email' });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({ to: recipient.email, subject, body });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});