import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me || me.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { rideId } = await req.json();
    if (!rideId) return Response.json({ error: 'rideId required' }, { status: 400 });

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    if (!accountSid || !authToken || !fromNumber) {
      return Response.json({ ok: false, reason: 'Twilio not configured' });
    }

    // Get the ride
    const ride = await base44.asServiceRole.entities.Ride.filter({ id: rideId });
    if (!ride || ride.length === 0) {
      return Response.json({ error: 'Ride not found' }, { status: 404 });
    }
    const r = ride[0];

    // Get confirmed bookings for this ride
    const bookings = await base44.asServiceRole.entities.RideBooking.filter({
      ride_id: rideId,
      booking_status: 'confirmed'
    });

    if (bookings.length === 0) {
      return Response.json({ sent: 0, message: 'No confirmed bookings on this ride' });
    }

    // Get passenger phone numbers
    const allUsers = await base44.asServiceRole.entities.User.list();
    const results = [];

    const rideDate = r.departure_date;
    const rideTime = r.departure_time;

    for (const booking of bookings) {
      const passenger = allUsers.find(u => u.id === booking.passenger_id);
      if (!passenger || !passenger.phone_number) {
        results.push({
          passengerName: booking.passenger_name,
          status: 'skipped',
          reason: 'No phone number on file'
        });
        continue;
      }

      let toNumber = passenger.phone_number.replace(/\D/g, '');
      if (toNumber.length === 10) toNumber = '+1' + toNumber;
      else if (!toNumber.startsWith('+')) toNumber = '+' + toNumber;

      const msg = `Aloha ${booking.passenger_name}! Reminder: your ride with ${r.driver_name || 'your driver'} from ${r.departure_location} to ${r.destination} is tomorrow, ${rideDate} at ${rideTime}. Please be ready on time. Mahalo from Cruise Kaua'i!`;

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
        if (twilioRes.ok) {
          results.push({ passengerName: booking.passenger_name, status: 'sent', sid: twilioResult.sid });
        } else {
          results.push({ passengerName: booking.passenger_name, status: 'failed', reason: twilioResult.message });
        }
      } catch (err) {
        results.push({ passengerName: booking.passenger_name, status: 'failed', reason: err.message });
      }
    }

    const sent = results.filter(r => r.status === 'sent').length;
    return Response.json({
      sent,
      total: bookings.length,
      ride: `${r.departure_location} → ${r.destination} on ${rideDate} at ${rideTime}`,
      driver: r.driver_name,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});