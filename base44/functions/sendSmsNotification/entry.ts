import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, message } = await req.json();

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return Response.json({ ok: false, reason: 'Twilio not configured' });
    }

    // Look up user's phone number
    const allUsers = await base44.asServiceRole.entities.User.list();
    const recipient = allUsers.find(u => u.id === userId);

    if (!recipient?.phone_number) {
      return Response.json({ ok: false, reason: 'No phone number on file' });
    }

    // Normalize phone number to E.164
    let toNumber = recipient.phone_number.replace(/\D/g, '');
    if (toNumber.length === 10) toNumber = '+1' + toNumber;
    else if (!toNumber.startsWith('+')) toNumber = '+' + toNumber;

    const body = new URLSearchParams({
      From: fromNumber,
      To: toNumber,
      Body: message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      return Response.json({ ok: false, reason: result.message });
    }

    return Response.json({ ok: true, sid: result.sid });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});