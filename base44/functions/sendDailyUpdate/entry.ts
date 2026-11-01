import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const formatRideDate = (dateStr, timeStr) => {
  // dateStr is YYYY-MM-DD, timeStr is like "2:00 PM"
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  // Normalize time: remove leading zero from hour if needed, remove space before AM/PM
  const normalizedTime = (timeStr || '').replace(/^0/, '').replace(/ (AM|PM)/, '$1');
  return `${dayName} ${monthName} ${day}${suffix} at ${normalizedTime}`;
};

const buildEmailBody = (firstName, newRides, newRequests, recipientId) => {
  const unsubscribeUrl = `https://cruisehi.org/Unsubscribe?user_id=${recipientId}`;
  const accountUrl = `https://cruisehi.org/account`;

  const rideRows = newRides.slice(0, 5).map(r => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #ede5d4;">
        <span style="font-size:0.9rem;margin-right:6px;">🚗</span>
        <strong>${r.departure_location} → ${r.destination}</strong><br>
        <span style="font-size:0.82rem;color:#666;">${formatRideDate(r.departure_date, r.departure_time)} · ${r.seats_available} seat${r.seats_available !== 1 ? 's' : ''} · @${r.driver_username || r.driver_name}</span>
      </td>
    </tr>`).join('');

  const requestRows = newRequests.slice(0, 5).map(r => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #ede5d4;">
        <span style="font-size:0.9rem;margin-right:6px;">🙋</span>
        <strong>${r.departure_location} → ${r.destination}</strong><br>
        <span style="font-size:0.82rem;color:#666;">${formatRideDate(r.departure_date, r.departure_time)} · ${r.seats_needed} seat${r.seats_needed !== 1 ? 's' : ''} needed · ${r.rider_username || r.rider_name}</span>
      </td>
    </tr>`).join('');

  const ridesSection = newRides.length > 0 ? `
    <h2 style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;margin:0 0 8px;">🚗 New Rides Available (${newRides.length})</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid #ede5d4;border-radius:12px;margin:0 0 24px;overflow:hidden;">
      ${rideRows}
      ${newRides.length > 5 ? `<tr><td style="padding:10px 16px;text-align:center;font-size:0.82rem;color:#888;">+${newRides.length - 5} more rides available</td></tr>` : ''}
    </table>` : '';

  const requestsSection = newRequests.length > 0 ? `
    <h2 style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;margin:0 0 8px;">🙋 Open Ride Requests (${newRequests.length})</h2>
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
          <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Hawaiʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #e8742a;display:block;margin:0 auto 10px;" />
          <div style="font-family:Georgia,serif;font-size:1.3rem;font-weight:700;color:#1a1a1a;">Cruise Hawaiʻi Daily Ride Update</div>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h1 style="font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#1a1a1a;margin:0 0 12px;">Aloha, ${firstName}! 🤙</h1>
          <p style="font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 24px;">Here's what's new in your community today — new rides posted and neighbors looking for a ride.</p>
          ${ridesSection}
          ${requestsSection}
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 16px;">
              <a href="https://cruisehi.org/trips" style="display:inline-block;background:#e8742a;color:#ffffff;text-decoration:none;font-weight:600;font-size:1rem;padding:14px 36px;border-radius:50px;">See All Rides →</a>
            </td></tr>
          </table>
          <p style="font-size:0.82rem;color:#aaa;text-align:center;margin:0;line-height:1.6;">Every shared ride = less traffic, more $$ in our local economy, &amp; more aloha. Mahalo for being a part of the movement! 🌺</p>
        </td></tr>
        <tr><td style="background:#faf7f2;border-top:1px solid #ede5d4;padding:20px 32px;text-align:center;">
          <p style="font-size:0.78rem;color:#aaa;line-height:1.6;margin:0 0 6px;">— The Cruise Hawaiʻi Team · <a href="${unsubscribeUrl}" style="color:#e8742a;text-decoration:none;">Unsubscribe</a> · <a href="https://cruisehi.org/" style="color:#e8742a;text-decoration:none;">cruisehi.org</a></p>
          <p style="font-size:0.75rem;color:#bbb;margin:0;">Receiving too many emails? <a href="${accountUrl}" style="color:#e8742a;text-decoration:none;">Update frequency here</a></p>
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

    // Only enforce auth for non-scheduled calls that include an Authorization header
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader && !authHeader.includes('service-role')) {
      const isAuthenticated = await base44.auth.isAuthenticated().catch(() => false);
      if (isAuthenticated) {
        const user = await base44.auth.me().catch(() => null);
        if (user && user.role !== 'admin') {
          return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const testEmail = payload.test_email;

    // Get rides and requests posted in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const todayStr = new Date().toISOString().split('T')[0];
    const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch data with reasonable limits to avoid timeouts
    const [allUsers, allRides, allRequests] = await Promise.all([
      base44.asServiceRole.entities.User.list('-created_date', 500),
      base44.asServiceRole.entities.Ride.filter({ status: 'active' }, '-created_date', 200),
      base44.asServiceRole.entities.RideRequest.filter({ status: 'active' }, '-created_date', 100),
    ]);

    // Non-recurring rides: posted in last 24 hours
    // Recurring rides: only include ones happening within the next 7 days (this week's rides)
    const parseTime = (timeStr = '') => {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 0;
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const period = match[3].toUpperCase();
      if (period === 'AM' && h === 12) h = 0;
      if (period === 'PM' && h !== 12) h += 12;
      return h * 60 + m;
    };

    const rideSort = (a, b) => {
      if (a.departure_date !== b.departure_date) return a.departure_date < b.departure_date ? -1 : 1;
      return parseTime(a.departure_time) - parseTime(b.departure_time);
    };

    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newRides = allRides.filter(r => {
      if (r.is_recurring) {
        // Only include recurring rides happening today or tomorrow
        return r.departure_date === todayStr || r.departure_date === tomorrowStr;
      }
      // Non-recurring: posted in last 24 hours and not in the past
      return r.created_date >= since && r.departure_date >= todayStr;
    }).sort(rideSort);
    // Include all active ride requests where the trip date hasn't passed yet
    const newRequests = allRequests.filter(r => r.departure_date >= todayStr).sort(rideSort);

    const subject = newRequests.length > 0
      ? `${newRides.length} new ride${newRides.length !== 1 ? 's' : ''} posted today + ${newRequests.length} open ride request${newRequests.length !== 1 ? 's' : ''}`
      : `${newRides.length} new ride${newRides.length !== 1 ? 's' : ''} posted today`;

    if (testEmail) {
      const testUser = allUsers.find(u => u.email === testEmail);
      const firstName = testUser?.full_name?.split(' ')[0] || 'there';
      const body = buildEmailBody(firstName, newRides, newRequests, testUser?.id || 'test');
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: testEmail,
        from_name: "Cruise Hawaiʻi",
        subject: `[PREVIEW] ${subject}`,
        body,
      });
      return Response.json({ ok: true, sent: 1, mode: 'test', newRides: newRides.length, newRequests: newRequests.length });
    }

    // Skip sending if nothing new today
    if (newRides.length === 0 && newRequests.length === 0) {
      return Response.json({ ok: true, skipped: 'nothing new today', sent: 0 });
    }

    // Filter recipients based on their email frequency preference
    const now = new Date();
    const todayDay = now.getDay(); // 0=Sun
    const todayDate = now.getDate();

    // Deduplicate by email, then filter by frequency preference
    // offset allows paginated sending: run automation twice, first half then second half
    const offset = payload.offset || 0;
    const PAGE_SIZE = 50;

    const seenEmails = new Set();
    // Exclude drivers (users with car_model, driver_license_state, or has_posted_rides)
    const allRecipients = allUsers.filter(u => {
      if (!u.email || seenEmails.has(u.email)) return false;
      // Skip drivers - they get the driver-specific daily update
      if (u.car_model || u.driver_license_state || u.has_posted_rides) return false;
      seenEmails.add(u.email);
      const freq = u.email_update_frequency || 'daily';
      if (freq === 'never') return false;
      if (freq === 'daily') return true;
      if (freq === 'every_3_days') return todayDate % 3 === 1;
      if (freq === 'weekly') return todayDay === 1; // Mondays
      if (freq === 'monthly') return todayDate === 1; // 1st of month
      return true;
    });

    const recipients = allRecipients.slice(offset, offset + PAGE_SIZE);
    const hasMore = offset + PAGE_SIZE < allRecipients.length;

    // If there are more recipients, invoke next page as a background task (non-blocking)
    if (hasMore) {
      base44.asServiceRole.functions.invoke('sendDailyUpdate', { offset: offset + PAGE_SIZE }).catch(() => null);
    }

    let sent = 0;
    const BATCH = 3;

    for (let i = 0; i < recipients.length; i += BATCH) {
      const batch = recipients.slice(i, i + BATCH);
      const results = await Promise.allSettled(batch.map(u => {
        const firstName = u.username || u.full_name?.split(' ')[0] || 'there';
        const body = buildEmailBody(firstName, newRides, newRequests, u.id);
        return base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          from_name: "Cruise Hawaiʻi",
          subject,
          body,
        });
      }));
      sent += results.filter(r => r.status === 'fulfilled').length;
      if (i + BATCH < recipients.length) await sleep(800);
    }

    return Response.json({ ok: true, sent, offset, hasMore, totalRecipients: allRecipients.length, newRides: newRides.length, newRequests: newRequests.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});