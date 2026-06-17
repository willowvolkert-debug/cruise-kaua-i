import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me || me.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { rideId, testNumber } = await req.json();
    if (!rideId) return Response.json({ error: 'rideId required' }, { status: 400 });

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    if (!accountSid || !authToken || !fromNumber) {
      return Response.json({ ok: false, reason: 'Twilio not configured' });
    }

    const ride = await base44.asServiceRole.entities.Ride.filter({ id: rideId });
    if (!ride || ride.length === 0) {
      return Response.json({ error: 'Ride not found' }, { status: 404 });
    }
    const r = ride[0];

    const price = r.price_per_seat != null ? `$${r.price_per_seat}/seat` : '';

    const msg = `Aloha! A ride from ${r.departure_location} to ${r.destination} is available on ${r.departure_date} at ${r.departure_time}${price ? ' for ' + price : ''}. To request a seat, find the ride on the "get a ride" page on the app on your Home Screen or at cruisehi.org. Mahalo from Cruise Kaua'i!`;

    // Preview mode: send to a single test number
    if (testNumber) {
      let toNumber = testNumber.replace(/\D/g, '');
      if (toNumber.length === 10) toNumber = '+1' + toNumber;
      else if (!toNumber.startsWith('+')) toNumber = '+' + toNumber;

      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: fromNumber, To: toNumber, Body: msg }).toString(),
        }
      );
      const twilioResult = await twilioRes.json();
      if (twilioRes.ok) {
        return Response.json({ preview: true, status: 'sent', sid: twilioResult.sid, to: toNumber, message: msg });
      }
      return Response.json({ preview: true, status: 'failed', reason: twilioResult.message });
    }

    // Blast mode: send to all users with a phone number (exclude admins)
    const allUsers = await base44.asServiceRole.entities.User.list();
    const recipients = allUsers.filter(u => u.phone_number && u.role !== 'admin' && u.drivers_license_verified === true);

    if (recipients.length === 0) {
      return Response.json({ sent: 0, message: 'No riders with phone numbers found' });
    }

    const results = [];

    for (const user of recipients) {
      let toNumber = user.phone_number.replace(/\D/g, '');
      if (toNumber.length === 10) toNumber = '+1' + toNumber;
      else if (!toNumber.startsWith('+')) toNumber = '+' + toNumber;

      try {
        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ From: fromNumber, To: toNumber, Body: msg }).toString(),
          }
        );
        const twilioResult = await twilioRes.json();
        results.push({
          name: user.full_name,
          status: twilioRes.ok ? 'sent' : 'failed',
          ...(twilioRes.ok ? { sid: twilioResult.sid } : { reason: twilioResult.message })
        });
      } catch (err) {
        results.push({ name: user.full_name, status: 'failed', reason: err.message });
      }
    }

    return Response.json({
      sent: results.filter(r => r.status === 'sent').length,
      total: recipients.length,
      ride: `${r.departure_location} → ${r.destination} on ${r.departure_date} at ${r.departure_time}`,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});