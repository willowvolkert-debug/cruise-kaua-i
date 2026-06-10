// SMS: Notify a passenger when their booking is accepted or denied by the driver
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const booking = payload.data;
    const oldBooking = payload.old_data;

    if (!booking || !oldBooking) return Response.json({ ok: true, skipped: 'no data' });

    const statusChanged = oldBooking.booking_status !== booking.booking_status;
    const isConfirmed = booking.booking_status === 'confirmed';
    const isRejected = booking.booking_status === 'rejected';

    if (!statusChanged || (!isConfirmed && !isRejected)) {
      return Response.json({ ok: true, skipped: 'status not changed to confirmed/rejected' });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    const passenger = allUsers.find(u => u.id === booking.passenger_id);

    if (!passenger?.sms_notifications_enabled || !passenger?.phone_number) {
      return Response.json({ ok: true, skipped: 'passenger not opted in or no phone' });
    }

    const driverName = booking.driver_username || 'Your driver';
    let message;
    if (isConfirmed) {
      message = `🚗🌀 Cruise Kauaʻi: Great news! ${driverName} accepted your ride request. Finish your profile or start posting/requesting rides here: https://cruisekauai.org`;
    } else {
      message = `🚗🌀 Cruise Kauaʻi: ${driverName} was unable to accept your ride request. Finish your profile or start posting/requesting rides here: https://cruisekauai.org`;
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    let normalized = passenger.phone_number.replace(/\D/g, '');
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