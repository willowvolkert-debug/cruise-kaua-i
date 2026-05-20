import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const sendSms = async (toNumber, message) => {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
  if (!accountSid || !authToken || !fromNumber) return;

  let normalized = toNumber.replace(/\D/g, '');
  if (normalized.length === 10) normalized = '+1' + normalized;
  else if (!normalized.startsWith('+')) normalized = '+' + normalized;

  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: fromNumber, To: normalized, Body: message }).toString(),
  });
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const request = payload.data;

    if (!request) return Response.json({ ok: true, skipped: 'no data' });

    const allUsers = await base44.asServiceRole.entities.User.list();
    const recipients = allUsers.filter(u => u.email && u.id !== request.rider_id && u.user_type === 'driver');

    let sent = 0;
    const BATCH_SIZE = 5;
    const DELAY_MS = 1000;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(u => {
        const driverFirstName = u.full_name?.split(' ')[0] || 'there';
        return base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          subject: `Someone nearby needs a ride: ${request.departure_location} → ${request.destination}`,
          body: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td align="center" style="padding:32px 24px 20px;border-bottom:1px solid #f0ebe0;">
          <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Kaua'i" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #e8742a;display:block;margin:0 auto 10px;" />
          <div style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;">Cruise Kaua'i</div>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h1 style="font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#1a1a1a;margin:0 0 12px;">Aloha, ${driverFirstName}! 🤙</h1>
          <p style="font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 20px;">Someone in your community needs a ride — and you might be going their way.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid #ede5d4;border-radius:12px;margin:0 0 20px;">
            <tr><td style="padding:16px 20px;border-bottom:1px solid #ede5d4;"><span style="font-size:1.1rem;margin-right:10px;">📍</span><strong>Route:</strong> ${request.departure_location} → ${request.destination}</td></tr>
            <tr><td style="padding:16px 20px;border-bottom:1px solid #ede5d4;"><span style="font-size:1.1rem;margin-right:10px;">📅</span><strong>Date:</strong> ${request.departure_date} at ${request.departure_time}</td></tr>
            <tr><td style="padding:16px 20px;border-bottom:1px solid #ede5d4;"><span style="font-size:1.1rem;margin-right:10px;">🪑</span><strong>Seats needed:</strong> ${request.seats_needed}</td></tr>
            <tr><td style="padding:16px 20px;"><span style="font-size:1.1rem;margin-right:10px;">🙋</span><strong>Rider:</strong> ${request.rider_username || request.rider_name}</td></tr>
          </table>
          <p style="font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 24px;">If you're heading that direction, open the app to connect with them. Every shared ride helps us all.</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0;">
              <a href="https://cruisekauai.org/Trips" style="display:inline-block;background:#e8742a;color:#ffffff;text-decoration:none;font-weight:600;font-size:1rem;padding:14px 36px;border-radius:50px;">See Ride Requests →</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#faf7f2;border-top:1px solid #ede5d4;padding:20px 32px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:0.95rem;color:#888;font-style:italic;margin:0 0 8px;">Mahalo nui loa 🌺</p>
          <p style="font-size:0.78rem;color:#aaa;line-height:1.6;margin:0;">— The Cruise Kaua'i Team · <a href="https://cruisekauai.org/" style="color:#e8742a;text-decoration:none;">cruisekauai.org</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
        }).then(() => { sent++; }).catch(() => null);
      }));

      // SMS to drivers with phone numbers
      await Promise.all(batch.map(u => {
        if (!u.phone_number) return Promise.resolve();
        const smsText = `Cruise Kaua'i: New ride request! ${request.departure_location} → ${request.destination} on ${request.departure_date} at ${request.departure_time}. Open the app to connect: https://cruisekauai.org/Trips`;
        return sendSms(u.phone_number, smsText).catch(() => null);
      }));

      if (i + BATCH_SIZE < recipients.length) await sleep(DELAY_MS);
    }

    return Response.json({ ok: true, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});