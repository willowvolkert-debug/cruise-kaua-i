// SMS: Notify all drivers when a rider posts a ride request
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const rideRequest = payload.data;

    if (!rideRequest) return Response.json({ ok: true, skipped: 'no data' });

    const allUsers = await base44.asServiceRole.entities.User.list();
    const drivers = allUsers.filter(u => 
      u.sms_notifications_enabled && 
      u.phone_number && 
      (u.user_type === 'driver' || u.vehicle_verified)
    );

    if (drivers.length === 0) return Response.json({ ok: true, skipped: 'no driver recipients' });

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return Response.json({ ok: false, reason: 'Twilio not configured' });
    }

    const loc = rideRequest.departure_location || '?';
    const dest = rideRequest.destination || '?';
    const date = rideRequest.departure_date || '?';
    const time = rideRequest.departure_time || '?';
    const rider = rideRequest.rider_name || rideRequest.rider_username || 'a rider';
    const seats = rideRequest.seats_needed || '?';

    const message = `🚗🌀 Cruise Kauaʻi: ${rider} is looking for a ride from ${loc} to ${dest} on ${date} at ${time}. ${seats} seat(s) needed. view the app on your Home Screen or cruisehi.org\n\nReply STOP to opt out.`;

    const results = [];
    for (const driver of drivers) {
      let normalized = driver.phone_number.replace(/\D/g, '');
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