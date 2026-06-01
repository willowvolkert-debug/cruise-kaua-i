import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const buildEmailBody = (firstName, newRides, newRequests, recipientId) => {
  const unsubscribeUrl = `https://www.cruisekauai.org/Unsubscribe?user_id=${recipientId}`;

  const rideRows = newRides.slice(0, 5).map(r => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #ede5d4;">
        <span style="font-size:0.9rem;margin-right:6px;">🚗</span>
        <strong>${r.departure_location} → ${r.destination}</strong><br>
        <span style="font-size:0.82rem;color:#666;">${r.departure_date} at ${r.departure_time} · ${r.seats_available} seat${r.seats_available !== 1 ? 's' : ''} · @${r.driver_username || r.driver_name}</span>
      </td>
    </tr>`).join('');

  const requestRows = newRequests.slice(0, 5).map(r => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #ede5d4;">
        <span style="font-size:0.9rem;margin-right:6px;">🙋</span>
        <strong>${r.departure_location} → ${r.destination}</strong><br>
        <span style="font-size:0.82rem;color:#666;">${r.departure_date} at ${r.departure_time} · ${r.seats_needed} seat${r.seats_needed !== 1 ? 's' : ''} needed · ${r.rider_username || r.rider_name}</span>
      </td>
    </tr>`).join('');

  const ridesSection = newRides.length > 0 ? `
    <h2 style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;margin:0 0 8px;">🚗 New Rides Available (${newRides.length})</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid #ede5d4;border-radius:12px;margin:0 0 24px;overflow:hidden;">
      ${rideRows}
      ${newRides.length > 5 ? `<tr><td style="padding:10px 16px;text-align:center;font-size:0.82rem;color:#888;">+${newRides.length - 5} more rides available</td></tr>` : ''}
    </table>` : '';

  const requestsSection = newRequests.length > 0 ? `
    <h2 style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;margin:0 0 8px;">🙋 New Ride Requests (${newRequests.length})</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid #ede5d4;border-radius:12px;margin:0 0 24px;overflow:hidden;">
      ${requestRows}
      ${newRequests.length > 5 ? `<tr><td style="padding:10px 16px;text-align:center;font-size:0.82rem;color:#888;">+${newRequests.length - 5} more requests</td></tr>` : ''}
    </table>` : '';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td align="center" style="padding:32px 24px 20px;border-bottom:1px solid #f0ebe0;">
          <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Kaua'i" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #e8742a;display:block;margin:0 auto 10px;" />
          <div style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;">Cruise Kaua'i</div>
          <div style="font-size:0.78rem;color:#aaa;margin-top:4px;">Daily Community Ride Update</div>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h1 style="font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#1a1a1a;margin:0 0 12px;">Aloha, ${firstName}! 🤙</h1>
          <p style="font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 24px;">Here's what's new in your community today — fresh rides posted and neighbors looking for a ride.</p>
          ${ridesSection}
          ${requestsSection}
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 16px;">
              <a href="https://cruisekauai.org/trips" style="display:inline-block;background:#e8742a;color:#ffffff;text-decoration:none;font-weight:600;font-size:1rem;padding:14px 36px;border-radius:50px;">See All Rides →</a>
            </td></tr>
          </table>
          <p style="font-size:0.82rem;color:#aaa;text-align:center;margin:0;line-height:1.6;">Every shared ride = less traffic, more aloha. Mahalo for being part of this.</p>
        </td></tr>
        <tr><td style="background:#faf7f2;border-top:1px solid #ede5d4;padding:20px 32px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:0.95rem;color:#888;font-style:italic;margin:0 0 8px;">Mahalo nui loa 🌺</p>
          <p style="font-size:0.78rem;color:#aaa;line-height:1.6;margin:0;">— The Cruise Kaua'i Team · <a href="${unsubscribeUrl}" style="color:#e8742a;text-decoration:none;">Unsubscribe</a> · <a href="https://cruisekauai.org/" style="color:#e8742a;text-decoration:none;">cruisekauai.org</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));

    // Allow admin-triggered or scheduled calls
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (isAuthenticated) {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // If preview=true, send a sample email with fake data to test recipient
    const testEmail = payload.test_email;
    if (testEmail) {
      const fakeRides = [
        { departure_location: "Līhuʻe", destination: "Hanalei", departure_date: "2026-06-01", departure_time: "8:00 AM", seats_available: 2, driver_username: "kealoha_drives" },
        { departure_location: "Kōloa", destination: "Kapa'a", departure_date: "2026-06-01", departure_time: "9:30 AM", seats_available: 3, driver_username: "malia_k" },
        { departure_location: "Waimea", destination: "Līhuʻe", departure_date: "2026-06-02", departure_time: "7:00 AM", seats_available: 1, driver_username: "surf_kai" },
      ];
      const fakeRequests = [
        { departure_location: "Princeville", destination: "Kōloa", departure_date: "2026-06-01", departure_time: "10:00 AM", seats_needed: 1, rider_username: "hana_w" },
        { departure_location: "Hanapēpē", destination: "Līhuʻe", departure_date: "2026-06-02", departure_time: "8:30 AM", seats_needed: 2, rider_username: "joe_local" },
      ];
      const body = buildEmailBody("Willow", fakeRides, fakeRequests, "test");
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: testEmail,
        subject: "[EXAMPLE] Your daily Cruise Kaua'i update 🌺",
        body,
      });
      return Response.json({ ok: true, sent: 1, mode: 'test' });
    }

    // Get rides and requests posted in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [allUsers, allRides, allRequests] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Ride.filter({ status: 'active' }),
      base44.asServiceRole.entities.RideRequest.filter({ status: 'active' }),
    ]);

    const newRides = allRides.filter(r => r.created_date >= since);
    const newRequests = allRequests.filter(r => r.created_date >= since);

    // Skip sending if nothing new today
    if (newRides.length === 0 && newRequests.length === 0) {
      return Response.json({ ok: true, skipped: 'nothing new today', sent: 0 });
    }

    const recipients = allUsers.filter(u => u.email);
    let sent = 0;
    const BATCH_SIZE = 5;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(u => {
        const firstName = u.full_name?.split(' ')[0] || 'there';
        const body = buildEmailBody(firstName, newRides, newRequests, u.id);
        return base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          from_name: "Cruise Kaua'i",
          subject: `${newRides.length} new ride${newRides.length !== 1 ? 's' : ''} + ${newRequests.length} request${newRequests.length !== 1 ? 's' : ''} posted today`,
          body,
        }).then(() => { sent++; }).catch(() => null);
      }));
      if (i + BATCH_SIZE < recipients.length) await sleep(1000);
    }

    return Response.json({ ok: true, sent, newRides: newRides.length, newRequests: newRequests.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});