import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const formatRideDate = (dateStr, timeStr) => {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  const normalizedTime = (timeStr || '').replace(/^0/, '').replace(/ (AM|PM)/, '$1');
  return `${dayName} ${monthName} ${day}${suffix} at ${normalizedTime}`;
};

const buildDriverEmail = (firstName, rideRequests, recentRides, recipientId) => {
  const unsubscribeUrl = `https://www.cruisekauai.org/Unsubscribe?user_id=${recipientId}`;
  const postRideUrl = `https://www.cruisekauai.org/trips?action=post_ride`;

  const requestRows = rideRequests.slice(0, 8).map(r => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #ede5d4;">
        <span style="font-size:0.9rem;margin-right:6px;">🙋</span>
        <strong>${r.departure_location} → ${r.destination}</strong><br>
        <span style="font-size:0.82rem;color:#666;">${formatRideDate(r.departure_date, r.departure_time)} · ${r.seats_needed} seat${r.seats_needed !== 1 ? 's' : ''} needed</span>
      </td>
    </tr>`).join('');

  const rideRows = recentRides.slice(0, 5).map(r => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #ede5d4;">
        <span style="font-size:0.9rem;margin-right:6px;">🚗</span>
        <strong>${r.departure_location} → ${r.destination}</strong><br>
        <span style="font-size:0.82rem;color:#666;">@${r.driver_username || r.driver_name}</span>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td align="center" style="padding:32px 24px 20px;border-bottom:1px solid #f0ebe0;">
          <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Hawaiʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #2f7d52;display:block;margin:0 auto 10px;" />
          <div style="font-family:Georgia,serif;font-size:1.3rem;font-weight:700;color:#1a1a1a;">Cruise Hawaiʻi Driver Update</div>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h1 style="font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#1a1a1a;margin:0 0 12px;">Aloha, ${firstName}! 🤙</h1>
          <p style="font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 24px;">Here are neighbors looking for rides today — and what other drivers are posting.</p>
          
          <div style="background:#f0fdf4;border-left:4px solid #2f7d52;border-radius:8px;padding:18px;margin-bottom:24px;">
            <h2 style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;margin:0 0 10px;">💡 Quick Reminder</h2>
            <p style="font-size:0.9rem;line-height:1.7;color:#444;margin:0 0 12px;">
              Got plans to drive anywhere soon? <strong>Post your ride</strong> and earn extra cash while helping neighbors get around. Even one seat makes a difference!
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${postRideUrl}" style="display:inline-block;background:#2f7d52;color:#ffffff;text-decoration:none;font-weight:600;font-size:0.95rem;padding:12px 28px;border-radius:50px;">Post Your Ride →</a>
              </td></tr>
            </table>
          </div>

          ${rideRequests.length > 0 ? `
            <h2 style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;margin:0 0 12px;">🙋 Ride Requests (${rideRequests.length})</h2>
            <p style="font-size:0.85rem;color:#666;margin:0 0 12px;">These neighbors need a ride — perfect opportunities for you!</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid #ede5d4;border-radius:12px;margin:0 0 24px;overflow:hidden;">
              ${requestRows}
              ${rideRequests.length > 8 ? `<tr><td style="padding:10px 16px;text-align:center;font-size:0.82rem;color:#888;">+${rideRequests.length - 8} more requests</td></tr>` : ''}
            </table>
          ` : '<p style="font-size:0.9rem;color:#666;margin:0 0 20px;">No open ride requests at the moment.</p>'}

          ${recentRides.length > 0 ? `
            <h2 style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;margin:0 0 12px;">🚗 Recently Posted by Other Drivers</h2>
            <p style="font-size:0.85rem;color:#666;margin:0 0 12px;">See what's being posted in your area:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid #ede5d4;border-radius:12px;margin:0 0 24px;overflow:hidden;">
              ${rideRows}
            </table>
          ` : ''}

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 16px;">
              <a href="${postRideUrl}" style="display:inline-block;background:#e8742a;color:#ffffff;text-decoration:none;font-weight:600;font-size:1rem;padding:14px 36px;border-radius:50px;">Post a Ride Now →</a>
            </td></tr>
          </table>

          <p style="font-size:0.82rem;color:#aaa;text-align:center;margin:0;line-height:1.6;">Every shared ride = less traffic, more $$ in our local economy, &amp; more aloha. Mahalo for being a part of the movement! 🌺</p>
        </td></tr>
        <tr><td style="background:#faf7f2;border-top:1px solid #ede5d4;padding:20px 32px;text-align:center;">
          <p style="font-size:0.78rem;color:#aaa;line-height:1.6;margin:0 0 6px;">— The Cruise Hawaiʻi Team · <a href="${unsubscribeUrl}" style="color:#e8742a;text-decoration:none;">Unsubscribe</a> · <a href="https://cruisekauai.org/" style="color:#e8742a;text-decoration:none;">cruisekauai.org</a></p>
          <p style="font-size:0.75rem;color:#bbb;margin:0;">Receiving too many emails? <a href="https://cruisekauai.org/account" style="color:#e8742a;text-decoration:none;">Update frequency here</a></p>
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

    const testEmail = payload.test_email;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [allUsers, allRideRequests, allRides] = await Promise.all([
      base44.asServiceRole.entities.User.list('-created_date', 500),
      base44.asServiceRole.entities.RideRequest.filter({ status: 'active' }, '-created_date', 100),
      base44.asServiceRole.entities.Ride.filter({ status: 'active' }, '-created_date', 200),
    ]);

    // Filter to drivers only (users with car_model or driver_license_state)
    const drivers = allUsers.filter(u => u.email && (u.car_model || u.driver_license_state));

    // Ride requests happening today or in the future
    const activeRequests = allRideRequests.filter(r => r.departure_date >= todayStr);

    // Recent non-recurring rides posted in last 24 hours (for inspiration)
    const recentRides = allRides.filter(r => {
      if (r.is_recurring) return false;
      return r.created_date >= since && r.departure_date >= todayStr;
    });

    if (testEmail) {
      const firstName = testEmail.split('@')[0] || 'Driver';
      const body = buildDriverEmail(firstName, activeRequests, recentRides, 'test');
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: testEmail,
        from_name: "Cruise Hawaiʻi",
        subject: `[PREVIEW] ${activeRequests.length} ride request${activeRequests.length !== 1 ? 's' : ''} need drivers`,
        body,
      });
      return Response.json({ ok: true, sent: 1, mode: 'test', rideRequests: activeRequests.length });
    }

    // Skip if no ride requests
    if (activeRequests.length === 0) {
      return Response.json({ ok: true, skipped: 'no ride requests today', sent: 0 });
    }

    const now = new Date();
    const todayDay = now.getDay();
    const todayDate = now.getDate();

    const offset = payload.offset || 0;
    const PAGE_SIZE = 50;

    const seenEmails = new Set();
    const eligibleDrivers = drivers.filter(u => {
      if (!u.email || seenEmails.has(u.email)) return false;
      seenEmails.add(u.email);
      const freq = u.email_update_frequency || 'daily';
      if (freq === 'never') return false;
      if (freq === 'daily') return true;
      if (freq === 'every_3_days') return todayDate % 3 === 1;
      if (freq === 'weekly') return todayDay === 1;
      if (freq === 'monthly') return todayDate === 1;
      return true;
    });

    const recipients = eligibleDrivers.slice(offset, offset + PAGE_SIZE);
    const hasMore = offset + PAGE_SIZE < eligibleDrivers.length;

    if (hasMore) {
      base44.asServiceRole.functions.invoke('sendDriverDailyUpdate', { offset: offset + PAGE_SIZE }).catch(() => null);
    }

    let sent = 0;
    const BATCH = 3;

    for (let i = 0; i < recipients.length; i += BATCH) {
      const batch = recipients.slice(i, i + BATCH);
      const results = await Promise.allSettled(batch.map(u => {
        const firstName = u.full_name?.split(' ')[0] || 'there';
        const body = buildDriverEmail(firstName, activeRequests, recentRides, u.id);
        return base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          from_name: "Cruise Hawaiʻi",
          subject: `${activeRequests.length} ride request${activeRequests.length !== 1 ? 's' : ''} need drivers`,
          body,
        });
      }));
      sent += results.filter(r => r.status === 'fulfilled').length;
      if (i + BATCH < recipients.length) await sleep(800);
    }

    return Response.json({ ok: true, sent, offset, hasMore, totalRecipients: eligibleDrivers.length, rideRequests: activeRequests.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});