// SMS: Notify a driver when someone requests a seat on their posted trip
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const booking = payload.data;

    if (!booking) return Response.json({ ok: true, skipped: 'no data' });
    // Only fire on newly paid bookings (create events where payment is complete)
    if (booking.payment_status !== 'paid') return Response.json({ ok: true, skipped: 'not paid yet' });

    const allUsers = await base44.asServiceRole.entities.User.list();
    const driver = allUsers.find(u => u.id === booking.driver_id);

    if (!driver?.sms_notifications_enabled || !driver?.phone_number) {
      return Response.json({ ok: true, skipped: 'driver not opted in or no phone' });
    }

    const riderName = booking.passenger_username || booking.passenger_name || 'Someone';
    const message = `Cruise Hawaiʻi: ${riderName} just requested a seat on your trip! view the application in your Home Screen, or the website- cruisehi.org`;

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    let normalized = driver.phone_number.replace(/\D/g, '');
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