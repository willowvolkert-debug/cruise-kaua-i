import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { user_name, user_email, subject, message, priority } = body;

    if (!subject?.trim() || !message?.trim()) {
      return Response.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    // Use the logged-in user's identity when available; fall back to provided/guest values
    let userId = 'guest';
    let userName = user_name || 'Guest';
    let userEmail = user_email || 'guest@unknown.com';
    try {
      const user = await base44.auth.me();
      if (user) {
        userId = user.id;
        userName = user.full_name || userName;
        userEmail = user.email || userEmail;
      }
    } catch (e) {
      // Unauthenticated — use guest fallbacks
    }

    // Service role bypasses ContactInquiry create RLS, so submissions work for anyone
    const inquiry = await base44.asServiceRole.entities.ContactInquiry.create({
      user_id: userId,
      user_name: userName,
      user_email: userEmail,
      subject,
      message,
      priority: priority || 'medium',
      status: 'pending'
    });

    return Response.json({ success: true, id: inquiry.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});