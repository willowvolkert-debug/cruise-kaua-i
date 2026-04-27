import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const ride = payload.data;

    if (!ride) return Response.json({ ok: true, skipped: 'no data' });

    const allUsers = await base44.asServiceRole.entities.User.list();
    const recipients = allUsers.filter(u => u.email && u.id !== ride.driver_id);

    let sent = 0;
    const BATCH_SIZE = 5;
    const DELAY_MS = 1000;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(u =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          subject: `🚗 New ride posted: ${ride.departure_location} → ${ride.destination}`,
          body: `<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;"><h2 style="color:#3b82f6;">Aloha ${u.full_name || 'there'}! 🚗</h2><p>A new ride has just been posted on Cruise Kauaʻi!</p><p>📍 <strong>Route:</strong> ${ride.departure_location} → ${ride.destination}<br/>📅 <strong>Date:</strong> ${ride.departure_date} at ${ride.departure_time}<br/>💺 <strong>Seats available:</strong> ${ride.seats_available}<br/>🚗 <strong>Driver:</strong> ${ride.driver_name}</p><p><a href="https://cruisekauai.base44.app" style="background-color:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">View & Book on Cruise Kauaʻi →</a></p><p>Mahalo,<br/>The Cruise Kauaʻi Team</p></body></html>`
        }).then(() => { sent++; }).catch(() => null)
      ));
      if (i + BATCH_SIZE < recipients.length) await sleep(DELAY_MS);
    }

    return Response.json({ ok: true, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});