// SMS: Notify all opted-in riders when a new (non-recurring) ride is posted
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const ride = payload.data;

    if (!ride) return Response.json({ ok: true, skipped: 'no data' });
    if (ride.is_recurring) return Response.json({ ok: true, skipped: 'recurring ride' });
    if (ride.is_last_minute) return Response.json({ ok: true, skipped: 'last-minute ride (handled by blast)' });

    // Dedup: only send SMS for the first ride or ride request a user posts per day
    const posterId = ride.driver_id;
    const todayStr = new Date().toISOString().substring(0, 10);
    const currentCreated = ride.created_date ? new Date(ride.created_date) : new Date();
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
    const riders = allUsers.filter(u => {
      if (!u.sms_notifications_enabled || !u.phone_number) return false;
      // Location filter: if user has preferred locations, only notify if ride matches
      const prefs = u.sms_preferred_locations;
      if (prefs && prefs.length > 0) {
        const rideLoc = (ride.departure_location || '').toLowerCase();
        const rideDest = (ride.destination || '').toLowerCase();
        const rideStops = (ride.stops || []).map(s => s.toLowerCase());
        return prefs.some(p => {
          const pl = p.toLowerCase();
          return rideLoc.includes(pl) || rideDest.includes(pl) || rideStops.includes(pl);
        });
      }
      return true; // No preferred locations = all locations
    });

    if (riders.length === 0) return Response.json({ ok: true, skipped: 'no rider recipients' });

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
    const price = ride.price_per_seat != null ? ` for $${ride.price_per_seat}/seat` : '';

    const formattedDate = (() => { try { const d = new Date(date.includes('T') ? date : date + 'T00:00:00'); return isNaN(d) ? date : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); } catch { return date; } })();
    const message = `Cruise Kauai: ${driver} - ${loc} to ${dest}, ${formattedDate} ${time}, ${seats} seat(s)${price}. cruisekauai.org STOP=optout`;

    // Deduplicate by phone number
    const seenPhones = new Set();
    const uniqueRiders = [];
    for (const user of riders) {
      let normalized = user.phone_number.replace(/\D/g, '');
      if (normalized.length === 10) normalized = '+1' + normalized;
      else if (!normalized.startsWith('+')) normalized = '+' + normalized;
      if (seenPhones.has(normalized)) continue;
      seenPhones.add(normalized);
      uniqueRiders.push(user);
    }

    const results = [];
    for (const user of uniqueRiders) {
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

    return Response.json({ ok: true, sent: results.filter(r => r.ok).length, total: riders.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});