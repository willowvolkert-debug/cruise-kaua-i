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
          body: `Aloha ${u.full_name || 'there'}!\n\nA new ride has just been posted on Cruise Kauaʻi!\n\n📍 Route: ${ride.departure_location} → ${ride.destination}\n📅 Date: ${ride.departure_date} at ${ride.departure_time}\n💺 Seats available: ${ride.seats_available}\n🚗 Driver: ${ride.driver_name}\n\nOpen the app to view and book this ride!\n\nMahalo,\nThe Cruise Kauaʻi Team`
        }).then(() => { sent++; }).catch(() => null)
      ));
      if (i + BATCH_SIZE < recipients.length) await sleep(DELAY_MS);
    }

    return Response.json({ ok: true, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});