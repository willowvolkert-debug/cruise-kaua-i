import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow both scheduled (no user) and admin-triggered calls
  const isAuthenticated = await base44.auth.isAuthenticated();
  if (isAuthenticated) {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const [allUsers, allRides, allRequests] = await Promise.all([
    base44.asServiceRole.entities.User.list(),
    base44.asServiceRole.entities.Ride.filter({ status: 'active' }),
    base44.asServiceRole.entities.RideRequest.filter({ status: 'active' }),
  ]);

  // Send to anyone who has ever posted or requested a ride
  const driverIds = new Set(allRides.map(r => r.driver_id).filter(Boolean));
  const riderIds = new Set(allRequests.map(r => r.rider_id).filter(Boolean));
  const activeIds = new Set([...driverIds, ...riderIds]);
  const recipients = allUsers.filter(u => u.email && activeIds.has(u.id) && u.email_update_frequency !== 'never');
  const activeRides = allRides.length;
  const activeRiders = allRequests.length;
  // Calculate potential savings: if each driver got just 1 rider, how much would be saved in gas?
  // Use price_per_seat_local if available, otherwise price_per_seat, as a proxy for gas cost sharing
  const moneySaved = allRides.reduce((sum, r) => {
    const price = r.price_per_seat_local || r.price_per_seat || 0;
    return sum + price;
  }, 0);
  const moneySavedStr = moneySaved > 0 ? '$' + Math.round(moneySaved).toLocaleString('en-US') : '$0';

  const routeHints = ['Līhuʻe to Hanalei', 'Kōloa to Kapa\'a', 'Hanapēpē to Līhuʻe', 'Princeville to Kōloa', 'Waimea to Līhuʻe'];

  let sent = 0;
  for (const recipient of recipients) {
    const firstName = recipient.username || recipient.full_name?.split(' ')[0] || 'there';
    const unsubscribeUrl = `https://cruisehi.org/Unsubscribe?user_id=${recipient.id}`;
    const routeHint = routeHints[Math.floor(Math.random() * routeHints.length)];

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipient.email,
      from_name: "Cruise Hawaiʻi",
      subject: `${activeRides} rides available on Kaua'i right now`,
      body: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td align="center" style="padding:32px 24px 20px;border-bottom:1px solid #f0ebe0;">
          <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Hawaiʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #e8742a;display:block;margin:0 auto 10px;" />
          <div style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;letter-spacing:0.02em;">Cruise Hawaiʻi</div>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h1 style="font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#1a1a1a;margin:0 0 12px;">Aloha, ${firstName}! 🤙</h1>
          <p style="font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 20px;">The community is moving — and there's a seat with your name on it. Here's what's happening on Cruise Hawaiʻi right now:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            <tr>
              <td width="32%" style="background:#faf7f2;border:1px solid #ede5d4;border-radius:10px;padding:14px 10px;text-align:center;">
                <div style="font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#e8742a;line-height:1;margin-bottom:4px;">${activeRides}</div>
                <div style="font-size:0.75rem;color:#888;line-height:1.3;">rides posted<br>this week</div>
              </td>
              <td width="4%"></td>
              <td width="32%" style="background:#faf7f2;border:1px solid #ede5d4;border-radius:10px;padding:14px 10px;text-align:center;">
                <div style="font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#e8742a;line-height:1;margin-bottom:4px;">${activeRiders}</div>
                <div style="font-size:0.75rem;color:#888;line-height:1.3;">neighbors<br>looking for rides</div>
              </td>
              <td width="4%"></td>
              <td width="32%" style="background:#faf7f2;border:1px solid #ede5d4;border-radius:10px;padding:14px 10px;text-align:center;">
                <div style="font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#e8742a;line-height:1;margin-bottom:4px;">${moneySavedStr}</div>
                <div style="font-size:0.75rem;color:#888;line-height:1.3;">potential gas<br>savings available</div>
              </td>
            </tr>
          </table>
          <p style="font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 24px;">Whether you're heading <strong>${routeHint}</strong> or anywhere in between — someone on this island is probably going your way. Post your drive, find a ride, and help us keep Kaua'i moving together.</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="https://cruisehi.org/" style="display:inline-block;background:#e8742a;color:#ffffff;text-decoration:none;font-weight:600;font-size:1rem;padding:14px 36px;border-radius:50px;letter-spacing:0.02em;">See What's Available →</a>
            </td></tr>
          </table>
          <p style="font-size:0.82rem;color:#aaa;text-align:center;margin:0;line-height:1.6;">Every shared ride = less traffic on the bypass, more money in local pockets.<br>Mahalo for being part of this.</p>
        </td></tr>
        <tr><td style="background:#faf7f2;border-top:1px solid #ede5d4;padding:20px 32px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:0.95rem;color:#888;font-style:italic;margin:0 0 8px;">Mahalo nui loa 🌺</p>
          <p style="font-size:0.78rem;color:#aaa;line-height:1.6;margin:0;">— The Cruise Hawaiʻi Team<br><a href="${unsubscribeUrl}" style="color:#e8742a;text-decoration:none;">Unsubscribe</a> · <a href="https://cruisehi.org/" style="color:#e8742a;text-decoration:none;">cruisehi.org</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
    });
    sent++;
  }

  return Response.json({ success: true, sent });
});