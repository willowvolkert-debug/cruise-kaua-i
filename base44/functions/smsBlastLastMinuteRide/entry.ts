// SMS: Blast all opted-in users when a last-minute ride is posted
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const ride = payload.data;

    if (!ride) return Response.json({ ok: true, skipped: 'no data' });
    if (!ride.is_last_minute) return Response.json({ ok: true, skipped: 'not last minute' });

    const allUsers = await base44.asServiceRole.entities.User.list();
    const recipients = allUsers.filter(u => u.sms_notifications_enabled && u.phone_number);

    if (recipients.length === 0) return Response.json({ ok: true, skipped: 'no recipients' });

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return Response.json({ ok: false, reason: 'Twilio not configured' });
    }

    const loc = ride.departure_location || '?';
    const dest = ride.destination || '?';
    const date = ride.departure_date || '?';
    const time = ride.departure_time || '?';
    const driver = ride.driver_name || ride.driver_username || 'a driver';
    const seats = ride.seats_available || '?';

    const message = `🚗🌀 Cruise Kauaʻi: Last-minute ride! ${driver} is driving from ${loc} to ${dest} on ${date} at ${time}. ${seats} seat(s) available. view the app on your Home Screen or cruisehi.org\n\nReply STOP to opt out.`;

    // Deduplicate by phone number
    const seenPhones = new Set();
    const uniqueRecipients = [];
    for (const user of recipients) {
      let normalized = user.phone_number.replace(/\D/g, '');
      if (normalized.length === 10) normalized = '+1' + normalized;
      else if (!normalized.startsWith('+')) normalized = '+' + normalized;
      if (seenPhones.has(normalized)) continue;
      seenPhones.add(normalized);
      uniqueRecipients.push(user);
    }

    const results = [];
    for (const user of uniqueRecipients) {
      let normalized = user.phone_number.replace(/\D/g, '');
      if (normalized.length === 10) normalized = '+1' + normalized;
      else if (!normalized.startsWith('+')) normalized = '+' + normalized;

      try {
        const resp = await fetch(
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
        const r = await resp.json();
        results.push({ to: normalized, ok: resp.ok, sid: r.sid, error: r.message || null });
      } catch (e) {
        results.push({ to: normalized, ok: false, error: e.message });
      }
    }

    return Response.json({ ok: true, sent: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});