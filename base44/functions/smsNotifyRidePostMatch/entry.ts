// SMS: Notify RidePost creators when a driver posts a ride matching their route + date
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const ride = payload.data;

    if (!ride) return Response.json({ ok: true, skipped: 'no data' });
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

    // Find active RidePosts matching the same route and date
    const allPosts = await base44.asServiceRole.entities.RidePost.list();
    const matchingPosts = allPosts.filter(p => {
      if (p.status !== 'active') return false;
      if (!p.rider_id || p.rider_id === ride.driver_id) return false; // don't notify the driver about their own post
      const sameDate = (p.departure_date || '').substring(0, 10) === (ride.departure_date || '').substring(0, 10);
      const sameRoute =
        (p.departure_location || '').toLowerCase().trim() === (ride.departure_location || '').toLowerCase().trim() &&
        (p.destination || '').toLowerCase().trim() === (ride.destination || '').toLowerCase().trim();
      return sameDate && sameRoute;
    });

    if (matchingPosts.length === 0) return Response.json({ ok: true, skipped: 'no matching ride posts' });

    // Look up rider users to get phone numbers
    const allUsers = await base44.asServiceRole.entities.User.list();
    const results = [];

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
    const driver = ride.driver_username || ride.driver_name || 'a driver';
    const seats = ride.seats_available || '?';
    const price = ride.price_per_seat != null ? ` for $${ride.price_per_seat}/seat` : '';
    const formattedDate = (() => { try { const d = new Date(date.includes('T') ? date : date + 'T00:00:00'); return isNaN(d) ? date : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); } catch { return date; } })();

    // Deduplicate by rider_id
    const seenRiders = new Set();
    for (const post of matchingPosts) {
      if (seenRiders.has(post.rider_id)) continue;
      seenRiders.add(post.rider_id);

      const rider = allUsers.find(u => u.id === post.rider_id);
      if (!rider || !rider.sms_notifications_enabled || !rider.phone_number) {
        results.push({ rider_id: post.rider_id, name: post.rider_name, skipped: 'no SMS opt-in or phone' });
        continue;
      }

      let normalized = rider.phone_number.replace(/\D/g, '');
      if (normalized.length === 10) normalized = '+1' + normalized;
      else if (!normalized.startsWith('+')) normalized = '+' + normalized;

      const message = `Cruise Hawaiʻi: Great news! ${driver} posted a ride matching your request: ${loc} to ${dest} on ${formattedDate} at ${time}. ${seats} seat(s) available${price}. Request a seat on the app or cruisekauai.org\n\nReply STOP to opt out.`;

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
        results.push({ rider_id: post.rider_id, name: post.rider_name, to: normalized, ok: resp.ok, sid: r.sid, error: r.message || null });
      } catch (e) {
        results.push({ rider_id: post.rider_id, name: post.rider_name, ok: false, error: e.message });
      }
    }

    return Response.json({ ok: true, sent: results.filter(r => r.ok).length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});