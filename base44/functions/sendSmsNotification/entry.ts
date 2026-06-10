import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Must be authenticated; only admins or the user themselves can trigger SMS
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { userId, message, directTo } = body;

    // Non-admins can only send to themselves
    if (me.role !== 'admin' && userId && userId !== me.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    // directTo (raw number) is admin-only
    if (directTo && me.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return Response.json({ ok: false, reason: 'Twilio not configured' });
    }

    let toNumber;

    if (directTo) {
      let raw = directTo.replace(/\D/g, '');
      if (raw.length === 10) toNumber = '+1' + raw;
      else if (!directTo.startsWith('+')) toNumber = '+' + raw;
      else toNumber = '+' + raw;
    } else {
      const allUsers = await base44.asServiceRole.entities.User.list();
      const recipient = allUsers.find(u => u.id === userId);

      if (!recipient || !recipient.phone_number) {
        return Response.json({ ok: false, reason: 'No phone number on file' });
      }

      let raw = recipient.phone_number.replace(/\D/g, '');
      if (raw.length === 10) toNumber = '+1' + raw;
      else if (!recipient.phone_number.startsWith('+')) toNumber = '+' + raw;
      else toNumber = '+' + raw;
    }

    const formBody = new URLSearchParams({ From: fromNumber, To: toNumber, Body: message });

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

    return Response.json({ ok: true, sid: result.sid, to: toNumber });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});