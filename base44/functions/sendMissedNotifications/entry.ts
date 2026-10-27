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
        `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px;">

<div style="text-align:center;margin-bottom:24px;">
  <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Hawaiʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #f97316;" />
  <p style="margin:8px 0 0 0;font-weight:bold;color:#3b82f6;font-size:15px;">Cruise Hawaiʻi</p>
</div>

<h2 style="color:#3b82f6;margin-bottom:16px;">Aloha! 🚗</h2>

<p style="margin-bottom:16px;">A new ride has been posted on Cruise Hawaiʻi!</p>

<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px;">
  <p style="margin:0 0 8px 0;">📍 <strong>Route:</strong> ${ride.departure_location} → ${ride.destination}</p>
  <p style="margin:0 0 8px 0;">📅 <strong>Date:</strong> ${ride.departure_date} at ${ride.departure_time}</p>
  <p style="margin:0 0 8px 0;">💺 <strong>Seats available:</strong> ${ride.seats_available}</p>
  <p style="margin:0;">🚗 <strong>Driver:</strong> ${ride.driver_name}</p>
</div>

<p style="margin-bottom:20px;">Open the app to view and book this ride!</p>

<p style="margin-bottom:32px;">
  <a href="https://cruisekauai.base44.app" style="background-color:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">View & Book on Cruise Hawaiʻi →</a>
</p>

<p style="margin-bottom:4px;">Mahalo,</p>
<p style="margin:0;"><strong>The Cruise Hawaiʻi Team</strong></p>

<hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;">
<p style="font-size:13px;color:#666;margin-bottom:8px;">Not sure how to use the app? <a href="https://cruisekauai.base44.app/Welcome" style="color:#3b82f6;">Re-watch our welcome flow here</a>.</p>
<p style="font-size:12px;color:#999;margin:0;">Replies to this email are not monitored. Please use the Contact Us form on the app or email willowvolkert@gmail.com with any questions.</p>

</body></html>`
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
        `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px;">

<div style="text-align:center;margin-bottom:24px;">
  <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Hawaiʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #f97316;" />
  <p style="margin:8px 0 0 0;font-weight:bold;color:#3b82f6;font-size:15px;">Cruise Hawaiʻi</p>
</div>

<h2 style="color:#3b82f6;margin-bottom:16px;">Aloha! 🙋</h2>

<p style="margin-bottom:16px;">Someone is looking for a ride on Cruise Hawaiʻi!</p>

<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px;">
  <p style="margin:0 0 8px 0;">📍 <strong>Route:</strong> ${request.departure_location} → ${request.destination}</p>
  <p style="margin:0 0 8px 0;">📅 <strong>Date:</strong> ${request.departure_date} at ${request.departure_time}</p>
  <p style="margin:0 0 8px 0;">💺 <strong>Seats needed:</strong> ${request.seats_needed}</p>
  <p style="margin:0;">🙋 <strong>Rider:</strong> ${request.rider_name}</p>
</div>

<p style="margin-bottom:20px;">If you're driving that route, open the app to connect with them!</p>

<p style="margin-bottom:32px;">
  <a href="https://cruisekauai.base44.app" style="background-color:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Open Cruise Hawaiʻi →</a>
</p>

<p style="margin-bottom:4px;">Mahalo,</p>
<p style="margin:0;"><strong>The Cruise Hawaiʻi Team</strong></p>

<hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;">
<p style="font-size:13px;color:#666;margin-bottom:8px;">Not sure how to use the app? <a href="https://cruisekauai.base44.app/Welcome" style="color:#3b82f6;">Re-watch our welcome flow here</a>.</p>
<p style="font-size:12px;color:#999;margin:0;">Replies to this email are not monitored. Please use the Contact Us form on the app or email willowvolkert@gmail.com with any questions.</p>

</body></html>`
      );
      results.push({ type: 'request', id: request.id, sent });
      await sleep(2000);
    }

    return Response.json({ ok: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});