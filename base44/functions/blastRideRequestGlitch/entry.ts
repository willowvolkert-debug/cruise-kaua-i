// SMS blast to all drivers: ride request glitch notice with open rider requests
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    const eligible = allUsers.filter(u => 
      u.phone_number && 
      u.sms_notifications_enabled === true && 
      (u.user_type === 'driver' || u.role === 'admin')
    );

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    const message = `🚗🌀 Cruise Kauaʻi: We had a glitch with ride requests not showing in the app, but we have 2 riders who need rides:\n\n1. Rohan — Kilauea → Lihue Airport, today (Sun 6/14) at 11 AM, 1 seat\n\n2. Kim — Lihue → Princeville, Tue 6/16 at 10:15 AM, 1 seat\n\nGo to Post a Ride and enter the details of their ride (or yours, if longer) — we will notify the rider to book it. Open the app on your Home Screen or cruisehi.org`;

    let sent = 0;
    let failed = 0;
    const errors = [];

    for (const u of eligible) {
      try {
        let normalized = u.phone_number.replace(/\D/g, '');
        if (normalized.length === 10) normalized = '+1' + normalized;
        else if (!normalized.startsWith('+')) normalized = '+' + normalized;

        const res = await fetch(
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
        if (res.ok) sent++;
        else { failed++; const j = await res.json(); errors.push({ to: normalized, error: j.message }); }
      } catch (e) {
        failed++;
        errors.push({ to: u.phone_number, error: e.message });
      }
      await new Promise(r => setTimeout(r, 100));
    }

    return Response.json({ ok: true, total: eligible.length, sent, failed, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});