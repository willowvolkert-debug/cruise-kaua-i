import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Sends a one-time welcome SMS to a new user when they enter their phone number.
// Called from the frontend with no payload needed — uses the authenticated user's session.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.phone_number) {
      return Response.json({ skipped: true, reason: 'no phone number on file' });
    }

    // Skip if already sent
    if (user.welcome_sms_sent) {
      return Response.json({ skipped: true, reason: 'already sent' });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return Response.json({ ok: false, reason: 'Twilio not configured' });
    }

    // Format phone number
    let raw = user.phone_number.replace(/\D/g, '');
    let toNumber;
    if (raw.length === 10) toNumber = '+1' + raw;
    else if (!user.phone_number.startsWith('+')) toNumber = '+' + raw;
    else toNumber = '+' + raw;

    const firstName = user.full_name?.split(' ')[0] || 'there';

    const message = `🚗🌀 Aloha ${firstName}! Welcome to Cruise Kauaʻi — a community carpooling app connecting neighbors on the island. Browse available rides, post your own, or request one. view the application in your Home Screen, or the website- cruisehi.org\n\nReply STOP to opt out.`;

    const formBody = new URLSearchParams({
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
        body: formBody.toString(),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      return Response.json({ ok: false, reason: result.message, code: result.code });
    }

    // Mark as sent so it doesn't fire again
    await base44.asServiceRole.entities.User.update(user.id, { welcome_sms_sent: true });

    return Response.json({ ok: true, sid: result.sid, to: toNumber });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});