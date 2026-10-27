import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { recipientId, recipientName, recipientEmail, subject, message, messageType } = await req.json();

    // Create the AdminMessage record
    const adminMsg = await base44.asServiceRole.entities.AdminMessage.create({
      recipient_id: recipientId,
      recipient_name: recipientName,
      recipient_email: recipientEmail || '',
      subject,
      message,
      message_type: messageType || 'info',
      is_read: false
    });

    // Send email notification to the recipient
    let emailAddress = recipientEmail;
    if (!emailAddress) {
      // Try to look up email from User entity
      const allUsers = await base44.asServiceRole.entities.User.list();
      const recipient = allUsers.find(u => u.id === recipientId);
      emailAddress = recipient?.email;
    }

    if (emailAddress) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: emailAddress,
        subject: `📬 New message from Cruise Hawaiʻi: ${subject}`,
        body: `Aloha ${recipientName},\n\nYou have a new message from the Cruise Hawaiʻi team:\n\n---\n${message}\n---\n\nLog in to Cruise Hawaiʻi to reply or view your inbox.\n\nMahalo,\nCruise Hawaiʻi Team`
      });
    }

    return Response.json({ ok: true, id: adminMsg.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});