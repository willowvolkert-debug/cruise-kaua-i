// SMS: Notify all opted-in riders when a driver creates a new recurring ride schedule
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DAY_ABBR = ['Sun', 'Mon', 'Tues', 'Weds', 'Thurs', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatSchedule(schedule) {
  const time = schedule.departure_time || '';
  if (schedule.schedule_type === 'weekly') {
    const days = schedule.weekly_days || [];
    if (days.length === 0) return `every week at ${time}`;
    const sorted = [...days].sort((a, b) => a - b);
    if (sorted.length === 1) {
      return `every ${DAY_FULL[sorted[0]]} at ${time}`;
    }
    return `every ${sorted.map(d => DAY_ABBR[d]).join(', ')} at ${time}`;
  } else if (schedule.schedule_type === 'monthly') {
    return `every month on the ${schedule.monthly_day} at ${time}`;
  } else if (schedule.schedule_type === 'specific_dates') {
    const dates = schedule.specific_dates || [];
    if (dates.length === 0) return `at ${time}`;
    const formatted = dates.map(d => {
      try {
        const dt = new Date(d + 'T00:00:00');
        return isNaN(dt) ? d : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch { return d; }
    });
    return `on ${formatted.join(', ')} at ${time}`;
  }
  return `at ${time}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const schedule = payload.data;

    if (!schedule) return Response.json({ ok: true, skipped: 'no data' });
    if (!schedule.is_active) return Response.json({ ok: true, skipped: 'schedule inactive' });

    // Look up the recurring trip template for route/time/seats details
    const trips = await base44.asServiceRole.entities.RecurringTrip.list();
    const trip = trips.find(t => t.id === schedule.recurring_trip_id);
    if (!trip) return Response.json({ ok: true, skipped: 'trip not found' });

    // Look up the driver
    const users = await base44.asServiceRole.entities.User.list('-created_date', 500);
    const driver = users.find(u => u.id === schedule.user_id);
    const driverName = driver?.full_name || trip.trip_name || 'a driver';

    // Build schedule description
    // Merge trip time into schedule for formatting
    const scheduleWithTime = { ...schedule, departure_time: trip.departure_time };
    const scheduleDesc = formatSchedule(scheduleWithTime);

    const loc = trip.departure_location || '?';
    const dest = trip.destination || '?';
    const seats = trip.seats_available || '?';
    const price = trip.price_per_seat != null && trip.price_per_seat > 0 ? ` for $${trip.price_per_seat}/seat` : '';

    const message = `Cruise Kauai: ${driverName} - recurring ride ${scheduleDesc}, ${loc} to ${dest}, ${seats} seat(s)${price}. cruisekauai.org STOP=optout`;

    // Find all opted-in riders
    const riders = users.filter(u => u.sms_notifications_enabled && u.phone_number);
    if (riders.length === 0) return Response.json({ ok: true, skipped: 'no rider recipients' });

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    if (!accountSid || !authToken || !fromNumber) {
      return Response.json({ ok: false, reason: 'Twilio not configured' });
    }

    // Deduplicate by phone number
    const seenPhones = new Set();
    const uniqueRiders = [];
    for (const user of riders) {
      let normalized = user.phone_number.replace(/\D/g, '');
      if (normalized.length === 10) normalized = '+1' + normalized;
      else if (!normalized.startsWith('+')) normalized = '+' + normalized;
      if (seenPhones.has(normalized)) continue;
      seenPhones.add(normalized);
      uniqueRiders.push({ ...user, _phone: normalized });
    }

    const results = [];
    for (const user of uniqueRiders) {
      try {
        const resp = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ From: fromNumber, To: user._phone, Body: message }).toString(),
          }
        );
        const r = await resp.json();
        results.push({ to: user._phone, ok: resp.ok, sid: r.sid, error: r.message || null });
      } catch (e) {
        results.push({ to: user._phone, ok: false, error: e.message });
      }
    }

    return Response.json({ ok: true, message, sent: results.filter(r => r.ok).length, total: uniqueRiders.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});