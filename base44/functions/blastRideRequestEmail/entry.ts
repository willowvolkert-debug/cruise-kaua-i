import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const APP_URL = "https://cruisekauai.org";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const buildLiveEmail = (firstName, rideReq, unsubUrl) => {
  const subject = `Ride request: ${rideReq.departure_location} → ${rideReq.destination}`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td align="center" style="padding:32px 24px 20px;border-bottom:1px solid #f0ebe0;">
          <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Kaua'i" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #2f7d52;display:block;margin:0 auto 10px;" />
          <div style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;">Cruise Kauaʻi</div>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h1 style="font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#1a1a1a;margin:0 0 12px;">Aloha, ${firstName}! 🤙</h1>
          <p style="font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 20px;">Someone in your community needs a ride — and you might be going their way!</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid #ede5d4;border-radius:12px;margin:0 0 20px;">
            <tr><td style="padding:16px 20px;border-bottom:1px solid #ede5d4;"><span style="font-size:1.1rem;margin-right:10px;">📍</span><strong>Route:</strong> ${rideReq.departure_location} → ${rideReq.destination}</td></tr>
            <tr><td style="padding:16px 20px;border-bottom:1px solid #ede5d4;"><span style="font-size:1.1rem;margin-right:10px;">📅</span><strong>Date:</strong> ${rideReq.departure_date} at ${rideReq.departure_time}${rideReq.is_flexible ? ' (flexible)' : ''}</td></tr>
            <tr><td style="padding:16px 20px;border-bottom:1px solid #ede5d4;"><span style="font-size:1.1rem;margin-right:10px;">🪑</span><strong>Seats needed:</strong> ${rideReq.seats_needed}</td></tr>
            ${rideReq.has_luggage ? `<tr><td style="padding:16px 20px;border-bottom:1px solid #ede5d4;"><span style="font-size:1.1rem;margin-right:10px;">🧳</span><strong>Has luggage</strong></td></tr>` : ''}
            <tr><td style="padding:16px 20px;"><span style="font-size:1.1rem;margin-right:10px;">🙋</span><strong>Rider:</strong> ${rideReq.rider_username || rideReq.rider_name}</td></tr>
          </table>
          <p style="font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 24px;">If you're heading that direction, open the app to connect with them. Every shared ride helps us all. 🌺</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0;">
              <a href="${APP_URL}/trips" style="display:inline-block;background:#2f7d52;color:#ffffff;text-decoration:none;font-weight:600;font-size:1rem;padding:14px 36px;border-radius:50px;">See Ride Requests →</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#faf7f2;border-top:1px solid #ede5d4;padding:20px 32px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:0.95rem;color:#888;font-style:italic;margin:0 0 8px;">Mahalo nui loa 🌺</p>
          <p style="font-size:0.78rem;color:#aaa;line-height:1.6;margin:0 0 4px;">— Willow, Founder of Cruise Kauaʻi · <a href="${APP_URL}" style="color:#2f7d52;text-decoration:none;">cruisekauai.org</a></p>
          <p style="font-size:0.75rem;margin:4px 0 0;"><a href="${unsubUrl}" style="color:#bbb;text-decoration:none;">unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  return { subject, html };
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

    // Parse body once
    const { preview, blast, rideRequestId } = await req.json().catch(() => ({}));

    // Fetch the live ride request
    let rideReq = null;
    if (rideRequestId) {
      const results = await base44.asServiceRole.entities.RideRequest.filter({ id: rideRequestId });
      rideReq = results[0];
    } else {
      // Default to most recent active request
      const all = await base44.asServiceRole.entities.RideRequest.filter({ status: 'active' });
      all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      rideReq = all[0];
    }

    if (!rideReq) return Response.json({ error: 'No active ride request found' }, { status: 404 });

    if (preview) {
      const { subject, html } = buildLiveEmail('Willow', rideReq, APP_URL + '/Unsubscribe?user_id=preview');
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'willowvolkert@gmail.com',
        from_name: "Cruise Kaua'i",
        subject: '[PREVIEW] ' + subject,
        body: html
      });
      return Response.json({ ok: true, mode: 'preview', ride_request: { from: rideReq.departure_location, to: rideReq.destination, date: rideReq.departure_date, time: rideReq.departure_time, rider: rideReq.rider_name } });
    }

    if (blast) {
      const allUsers = await base44.asServiceRole.entities.User.list();
      const drivers = allUsers.filter(u => 
        u.email && 
        u.drivers_license_verified === true &&
        (u.preferred_island || '').toLowerCase().startsWith('kauai') &&
        u.email_update_frequency !== 'never'
      );
      let sent = 0, errors = 0;
      const BATCH_SIZE = 5;

      for (let i = 0; i < drivers.length; i += BATCH_SIZE) {
        const batch = drivers.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (u) => {
          const firstName = u.full_name?.split(' ')[0] || 'there';
          const unsubUrl = APP_URL + '/Unsubscribe?user_id=' + u.id;
          const { subject, html } = buildLiveEmail(firstName, rideReq, unsubUrl);
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: u.email,
              from_name: "Cruise Kaua'i",
              subject,
              body: html
            });
            sent++;
          } catch (e) { errors++; }
        }));
        if (i + BATCH_SIZE < drivers.length) await sleep(1000);
      }

      return Response.json({ ok: true, sent, errors, total_drivers: drivers.length });
    }

    return Response.json({ error: 'Pass preview:true or blast:true' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});