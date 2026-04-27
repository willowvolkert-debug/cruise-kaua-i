import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const request = payload.data;

    if (!request) return Response.json({ ok: true, skipped: 'no data' });

    const allUsers = await base44.asServiceRole.entities.User.list();
    const recipients = allUsers.filter(u => u.email && u.id !== request.rider_id);

    let sent = 0;
    const BATCH_SIZE = 5;
    const DELAY_MS = 1000;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(u =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          subject: `🙋 New ride request: ${request.departure_location} → ${request.destination}`,
          body: `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px;">

<h2 style="color:#3b82f6;margin-bottom:16px;">Aloha ${u.full_name || 'there'}! 🙋</h2>

<p style="margin-bottom:16px;">Someone is looking for a ride on Cruise Kauaʻi!</p>

<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px;">
  <p style="margin:0 0 8px 0;">📍 <strong>Route:</strong> ${request.departure_location} → ${request.destination}</p>
  <p style="margin:0 0 8px 0;">📅 <strong>Date:</strong> ${request.departure_date} at ${request.departure_time}</p>
  <p style="margin:0 0 8px 0;">💺 <strong>Seats needed:</strong> ${request.seats_needed}</p>
  <p style="margin:0;">🙋 <strong>Rider:</strong> ${request.rider_name}</p>
</div>

<p style="margin-bottom:20px;">If you're driving that route, open the app to connect with them!</p>

<p style="margin-bottom:32px;">
  <a href="https://cruisekauai.base44.app" style="background-color:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Open Cruise Kauaʻi →</a>
</p>

<p style="margin-bottom:4px;">Mahalo,</p>
<p style="margin:0;"><strong>The Cruise Kauaʻi Team</strong></p>

<hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;">
<p style="font-size:13px;color:#666;margin-bottom:8px;">Not sure how to use the app? <a href="https://cruisekauai.base44.app/Welcome" style="color:#3b82f6;">Re-watch our welcome flow here</a>.</p>
<p style="font-size:12px;color:#999;margin:0;">Replies to this email are not monitored. Please use the Contact Us form on the app or email willowvolkert@gmail.com with any questions.</p>

</body></html>`
        }).then(() => { sent++; }).catch(() => null)
      ));
      if (i + BATCH_SIZE < recipients.length) await sleep(DELAY_MS);
    }

    return Response.json({ ok: true, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});