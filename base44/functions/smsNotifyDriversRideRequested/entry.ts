// SMS: Notify all drivers when a rider posts a ride request
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { matchesLocation, userIsland } from '../../shared/locations.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const rideRequest = payload.data;

    if (!rideRequest) return Response.json({ ok: true, skipped: 'no data' });

    // Dedup: only send SMS for the first ride or ride request a user posts per day
    const posterId = rideRequest.rider_id;
    const todayStr = new Date().toISOString().substring(0, 10);
    const currentCreated = rideRequest.created_date ? new Date(rideRequest.created_date) : new Date();
    const [allRidesToday, allPostsToday] = await Promise.all([
      base44.asServiceRole.entities.Ride.list(),
      base44.asServiceRole.entities.RidePost.list()
    ]);
    const earlierToday = [
      ...allRidesToday.filter(r => r.driver_id === posterId && (r.created_date || '').substring(0, 10) === todayStr && new Date(r.created_date) < currentCreated),
      ...allPostsToday.filter(p => p.rider_id === posterId && (p.created_date || '').substring(0, 10) === todayStr && new Date(p.created_date) < currentCreated)
    ];
    if (earlierToday.length > 0) {
      return Response.json({ ok: true, skipped: 'user already posted a ride or request earlier today' });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    const drivers = allUsers.filter(u => {
      if (!u.sms_notifications_enabled || !u.phone_number || u.drivers_license_verified !== true || u.vehicle_verified !== true) return false;
      if (u.sms_notify_ride_requests === false) return false;
      if (userIsland(u) !== (rideRequest.island || 'Kauai')) return false;
      // Location filter: if user has preferred locations, only notify if ride request matches
      return matchesLocation(u.sms_preferred_locations, [rideRequest.departure_location, rideRequest.destination, ...(rideRequest.stops || [])]);
    });

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

    const formattedDate = (() => { try { const d = new Date(date.includes('T') ? date : date + 'T00:00:00'); return isNaN(d) ? date : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); } catch { return date; } })();
    const message = `Cruise Kauai: ${rider} needs ride ${loc} to ${dest}, ${formattedDate} ${time}, ${seats} seat(s). cruisehi.org STOP=optout`;

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