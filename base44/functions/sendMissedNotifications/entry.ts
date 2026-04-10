import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function sendBatchEmails(base44, recipients, subject, body) {
  const BATCH_SIZE = 5;
  let sent = 0;
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(u =>
      base44.asServiceRole.integrations.Core.SendEmail({ to: u.email, subject, body })
        .then(() => { sent++; }).catch(() => null)
    ));
    if (i + BATCH_SIZE < recipients.length) await sleep(1000);
  }
  return sent;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const allUsers = await base44.asServiceRole.entities.User.list();
    const allRides = await base44.asServiceRole.entities.Ride.list('-created_date');
    const allRequests = await base44.asServiceRole.entities.RideRequest.list('-created_date');

    // Get rides/requests from last 7 days
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentRides = allRides.filter(r => r.status === 'active' && r.created_date >= cutoff);
    const recentRequests = allRequests.filter(r => r.status === 'active' && r.created_date >= cutoff);

    const results = [];

    for (const ride of recentRides) {
      const recipients = allUsers.filter(u => u.email && u.id !== ride.driver_id);
      const sent = await sendBatchEmails(
        base44,
        recipients,
        `🚗 New ride posted: ${ride.departure_location} → ${ride.destination}`,
        `Aloha!\n\nA new ride has been posted on Cruise Kauaʻi!\n\n📍 Route: ${ride.departure_location} → ${ride.destination}\n📅 Date: ${ride.departure_date} at ${ride.departure_time}\n💺 Seats available: ${ride.seats_available}\n🚗 Driver: ${ride.driver_name}\n\nOpen the app to view and book this ride!\n\nMahalo,\nThe Cruise Kauaʻi Team`
      );
      results.push({ type: 'ride', id: ride.id, sent });
      await sleep(2000);
    }

    for (const request of recentRequests) {
      const recipients = allUsers.filter(u => u.email && u.id !== request.rider_id);
      const sent = await sendBatchEmails(
        base44,
        recipients,
        `🙋 New ride request: ${request.departure_location} → ${request.destination}`,
        `Aloha!\n\nSomeone is looking for a ride on Cruise Kauaʻi!\n\n📍 Route: ${request.departure_location} → ${request.destination}\n📅 Date: ${request.departure_date} at ${request.departure_time}\n💺 Seats needed: ${request.seats_needed}\n🙋 Rider: ${request.rider_name}\n\nIf you're driving that route, open the app to connect with them!\n\nMahalo,\nThe Cruise Kauaʻi Team`
      );
      results.push({ type: 'request', id: request.id, sent });
      await sleep(2000);
    }

    return Response.json({ ok: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});