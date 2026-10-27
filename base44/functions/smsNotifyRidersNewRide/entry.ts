// SMS: Notify all opted-in riders when a new (non-recurring) ride is posted
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { matchesLocation } from '../../shared/locations.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const ride = payload.data;

    if (!ride) return Response.json({ ok: true, skipped: 'no data' });
    if (ride.is_recurring) return Response.json({ ok: true, skipped: 'recurring ride' });
    if (ride.is_last_minute) return Response.json({ ok: true, skipped: 'last-minute ride (handled by blast)' });

    // Never send SMS for rides that have already departed.
    // Times are stored in Hawaiʻi time (HST = UTC-10). Parse formats like
    // "630 PM", "4 PM", "10 AM" and compare against now.
    const now = new Date();
    const depDateStr = ride.departure_date || '';
    const timeStr = (ride.departure_time || '').trim();
    let depDateTime = null;
    const tm = timeStr.match(/^(\d{1,2})(\d{2})?\s*(AM|PM)$/i);
    if (tm && depDateStr) {
      let h = parseInt(tm[1], 10);
      const min = tm[2] ? parseInt(tm[2], 10) : 0;
      const ampm = tm[3].toUpperCase();
      if (ampm === 'PM' && h !== 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      const [y, mo, d] = depDateStr.split('-').map(Number);
      depDateTime = new Date(Date.UTC(y, mo - 1, d, h + 10, min)); // HST -> UTC
    }
    if (depDateTime && depDateTime < now) {
      return Response.json({ ok: true, skipped: 'ride already departed' });
    }
    if (!depDateTime && depDateStr && depDateStr < now.toISOString().substring(0, 10)) {
      return Response.json({ ok: true, skipped: 'ride date in the past' });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    const riders = allUsers.filter(u => {
      if (!u.sms_notifications_enabled || !u.phone_number) return false;
      if (u.sms_notify_posted_rides === false) return false;
      // Don't blast drivers about new rides — they post rides, they don't need "new ride available" alerts
      if (u.user_type === 'driver') return false;
      // Don't notify the driver who posted this ride about their own ride
      if (u.id === ride.driver_id) return false;
      // Location filter: if user has preferred locations, only notify if ride matches
      return matchesLocation(u.sms_preferred_locations, [ride.departure_location, ride.destination, ...(ride.stops || [])]);
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