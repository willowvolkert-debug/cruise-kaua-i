import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { to, subject, body: emailBody } = body;
    if (!to || !subject || !emailBody) {
      return Response.json({ error: 'Missing to, subject, or body' }, { status: 400 });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      subject,
      body: emailBody
    });

    return Response.json({ success: true, message: `Email sent to ${to}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});