import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow both scheduled (no user) and admin-triggered calls
  const isAuthenticated = await base44.auth.isAuthenticated();
  if (isAuthenticated) {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const allUsers = await base44.asServiceRole.entities.User.list();
  const recipients = allUsers.filter(u => u.user_type === 'rider' || u.user_type === 'driver');

  let sent = 0;
  for (const recipient of recipients) {
    const firstName = recipient.full_name?.split(' ')[0] || 'there';
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipient.email,
      subject: "Plan your next ride on Cruise Kauaʻi",
      body: `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px;">

<div style="text-align:center;margin-bottom:24px;">
  <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Kauaʻi" style="width:80px;height:80px;border-radius:16px;object-fit:cover;" />
</div>

<h2 style="color:#3b82f6;margin-bottom:16px;">Aloha ${firstName}! 🌺</h2>

<p style="margin-bottom:16px;">Just a friendly reminder that Cruise Kauaʻi is here to help you get around the island.</p>

<p style="margin-bottom:8px;">🚗 <strong>Driving soon?</strong> Post your ride and offer seats to fellow community members.</p>
<p style="margin-bottom:20px;">🙋 <strong>Need a ride?</strong> Request one in advance so drivers can plan accordingly.</p>

<p style="margin-bottom:32px;">
  <a href="https://cruisekauai.org" style="background-color:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Plan Your Next Trip →</a>
</p>

<p style="margin-bottom:4px;">Mahalo for being part of the Cruise Kauaʻi community!</p>
<p style="margin:0;"><strong>– The Cruise Kauaʻi Team</strong></p>

<hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;">
<p style="font-size:13px;color:#666;margin-bottom:8px;">Not sure how to use the app? <a href="https://cruisekauai.base44.app/Welcome" style="color:#3b82f6;">Re-watch the welcome tutorial here</a>.</p>
<p style="font-size:12px;color:#999;margin:0;">Replies to this email are not monitored. Please use the Contact Us form on the app or email willowvolkert@gmail.com with any questions.</p>

</body></html>`
    });
    sent++;
  }

  return Response.json({ success: true, sent });
});