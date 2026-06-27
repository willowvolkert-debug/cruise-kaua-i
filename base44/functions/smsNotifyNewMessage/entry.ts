// SMS: Notify a user when they receive a new message in a booking chat
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const booking = payload.data;
    const oldBooking = payload.old_data;

    if (!booking || !oldBooking) return Response.json({ ok: true, skipped: 'no data' });

    const oldMsgCount = (oldBooking.messages || []).length;
    const newMsgCount = (booking.messages || []).length;

    if (newMsgCount <= oldMsgCount) return Response.json({ ok: true, skipped: 'no new messages' });

    const lastMessage = booking.messages[newMsgCount - 1];
    if (!lastMessage) return Response.json({ ok: true, skipped: 'no last message' });

    const senderId = lastMessage.sender_id;
    const senderName = lastMessage.sender_name || 'Someone';

    // Notify the OTHER party (not the sender)
    const recipientId = String(senderId) === String(booking.driver_id)
      ? booking.passenger_id
      : booking.driver_id;

    const allUsers = await base44.asServiceRole.entities.User.list();
    const recipient = allUsers.find(u => u.id === recipientId);

    if (!recipient?.sms_notifications_enabled || !recipient?.phone_number) {
      return Response.json({ ok: true, skipped: 'recipient not opted in or no phone' });
    }

    const message = `Cruise Kauaʻi: ${senderName} sent you a message! view the application in your Home Screen, or the website- cruisehi.org`;

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    let normalized = recipient.phone_number.replace(/\D/g, '');
    if (normalized.length === 10) normalized = '+1' + normalized;
    else if (!normalized.startsWith('+')) normalized = '+' + normalized;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ From: fromNumber, To: normalized, Body: message }).toString(),
      }
    );

    const result = await response.json();
    return Response.json({ ok: response.ok, sid: result.sid, to: normalized });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});