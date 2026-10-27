// SMS: Confirm to a user that their ride or ride request was posted successfully
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const event = payload.event;

    if (!event) return Response.json({ ok: true, skipped: 'no event' });

    const entityName = event.entity_name;
    const data = payload.data;
    if (!data) return Response.json({ ok: true, skipped: 'no data' });

    // Determine user ID based on entity type
    const userId = entityName === 'Ride' ? data.driver_id : data.rider_id;
    if (!userId) return Response.json({ ok: true, skipped: 'no user id' });

    const allUsers = await base44.asServiceRole.entities.User.list();
    const user = allUsers.find(u => u.id === userId);

    if (!user?.sms_notifications_enabled || !user?.phone_number) {
      return Response.json({ ok: true, skipped: 'user not opted in or no phone' });
    }

    let message;
    const formattedDate = (() => { try { const d = new Date((data.departure_date || '').includes('T') ? data.departure_date : (data.departure_date || '') + 'T00:00:00'); return isNaN(d) ? data.departure_date : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); } catch { return data.departure_date; } })();
    if (entityName === 'Ride') {
      message = `Cruise Hawaiʻi: Your ride from ${data.departure_location} to ${data.destination} on ${formattedDate} has been posted! view the application in your Home Screen, or the website- cruisehi.org\n\nReply STOP to opt out.`;
    } else {
      message = `Cruise Hawaiʻi: Your ride request from ${data.departure_location} to ${data.destination} on ${formattedDate} has been posted! view the application in your Home Screen, or the website- cruisehi.org\n\nReply STOP to opt out.`;
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return Response.json({ ok: false, reason: 'Twilio not configured' });
    }

    let normalized = user.phone_number.replace(/\D/g, '');
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