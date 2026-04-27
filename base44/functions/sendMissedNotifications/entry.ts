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
        `<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;"><h2 style="color:#3b82f6;">Aloha! 🚗</h2><p>A new ride has been posted on Cruise Kauaʻi!</p><p>📍 <strong>Route:</strong> ${ride.departure_location} → ${ride.destination}<br/>📅 <strong>Date:</strong> ${ride.departure_date} at ${ride.departure_time}<br/>💺 <strong>Seats available:</strong> ${ride.seats_available}<br/>🚗 <strong>Driver:</strong> ${ride.driver_name}</p><p><a href="https://cruisekauai.base44.app" style="background-color:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">View & Book on Cruise Kauaʻi →</a></p><p>Mahalo,<br/>The Cruise Kauaʻi Team</p></body></html>`
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
        `<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;"><h2 style="color:#3b82f6;">Aloha! 🙋</h2><p>Someone is looking for a ride on Cruise Kauaʻi!</p><p>📍 <strong>Route:</strong> ${request.departure_location} → ${request.destination}<br/>📅 <strong>Date:</strong> ${request.departure_date} at ${request.departure_time}<br/>💺 <strong>Seats needed:</strong> ${request.seats_needed}<br/>🙋 <strong>Rider:</strong> ${request.rider_name}</p><p><a href="https://cruisekauai.base44.app" style="background-color:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Open Cruise Kauaʻi →</a></p><p>Mahalo,<br/>The Cruise Kauaʻi Team</p></body></html>`
      );
      results.push({ type: 'request', id: request.id, sent });
      await sleep(2000);
    }

    return Response.json({ ok: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});