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
      subject: "Plan your next ride on Cruise Kauaʻi 🌺", 🌺",
      body: `Aloha ${firstName}!\n\nJust a friendly reminder that Cruise Kauaʻi is here to help you get around the island.\n\n🚗 Driving soon? Post your ride and offer seats to fellow community members.\n🙋 Need a ride? Request one in advance so drivers can plan accordingly.\n\nLog in and plan your next trip at https://cruisekauai.org\n\nMahalo for being part of the Cruise Kauaʻi community!\n\n– The Cruise Kauaʻi Team`
    });
    sent++;
  }

  return Response.json({ success: true, sent });
});