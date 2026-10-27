// One-time blast: notify all opted-in users that SMS notifications are now live
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { customMessage, targetGroup } = await req.json().catch(() => ({}));

    const allUsers = await base44.asServiceRole.entities.User.list();
    
    let eligible;
    if (targetGroup === 'verified_drivers') {
      eligible = allUsers.filter(u => u.user_type === 'driver' && u.phone_number && u.sms_notifications_enabled === true);
    } else {
      eligible = allUsers.filter(u => u.phone_number && u.sms_notifications_enabled === true);
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    const message = customMessage || `Cruise Hawaiʻi SMS is live! You'll now get texts when riders request seats, drivers accept/deny, and new messages come in. Finish your profile or start posting/requesting rides by opening the application in your Home Screen, or the website- cruisehi.org`;

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
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 100));
    }

    return Response.json({ ok: true, total: eligible.length, sent, failed, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});