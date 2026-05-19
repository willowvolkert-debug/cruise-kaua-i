import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId, bookingId } = await req.json();

    const allUsers = await base44.asServiceRole.entities.User.list();
    const driver = allUsers.find(u => u.id === userId);

    if (!driver?.email) {
      return Response.json({ ok: false, reason: 'Driver not found or no email' });
    }

    // Fetch booking details
    const allBookings = await base44.asServiceRole.entities.RideBooking.filter({ id: bookingId });
    const booking = allBookings[0];
    if (!booking) return Response.json({ ok: false, reason: 'Booking not found' });

    // Fetch ride details
    const allRides = await base44.asServiceRole.entities.Ride.filter({ id: booking.ride_id });
    const ride = allRides[0];
    if (!ride) return Response.json({ ok: false, reason: 'Ride not found' });

    const driverFirstName = driver.full_name?.split(' ')[0] || 'there';
    const riderUsername = booking.passenger_username || booking.passenger_name;
    const riderRealName = booking.passenger_name;
    const payoutAmount = `$${((booking.total_amount || 0) * 0.9).toFixed(2)}`;
    const riderMessage = booking.description || 'No message provided';

    const subject = `You've got a rider! ${riderRealName} wants to book your trip`;
    const body = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td align="center" style="padding:32px 24px 20px;border-bottom:1px solid #f0ebe0;">
          <div style="width:72px;height:72px;border-radius:50%;border:3px solid #e8742a;background:linear-gradient(135deg,#2d6a4f,#52b788,#e8742a);margin:0 auto 10px;line-height:72px;text-align:center;font-size:28px;">🚗</div>
          <div style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;">Cruise Kaua'i</div>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h1 style="font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#1a1a1a;margin:0 0 12px;">You've got a rider, ${driverFirstName}! 🎉</h1>
          <p style="font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 20px;"><strong>${riderRealName}</strong> has requested a seat on your upcoming drive. They've already paid — you just need to confirm.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff8f0,#fff3e6);border:2px solid #e8742a;border-radius:12px;margin:0 0 20px;">
            <tr><td style="padding:18px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="auto" style="padding-right:16px;">
                    <div style="font-size:0.7rem;color:#aaa;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">YOUR PAYOUT</div>
                    <div style="font-family:Georgia,serif;font-size:2.2rem;font-weight:700;color:#e8742a;line-height:1;">${payoutAmount}</div>
                  </td>
                  <td style="font-size:0.82rem;color:#666;line-height:1.5;border-left:1px solid #f0d0b0;padding-left:16px;">Released to you once the rider confirms the trip is complete.<br>The rider has already paid.</td>
                </tr>
              </table>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid #ede5d4;border-radius:12px;margin:0 0 20px;">
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">📍</span><strong>Route:</strong> ${ride.departure_location} → ${ride.destination}</td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">📅</span><strong>Date:</strong> ${ride.departure_date} at ${ride.departure_time}</td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">🪑</span><strong>Seats:</strong> ${booking.seats_booked}</td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">🙋</span><strong>Rider:</strong> ${riderUsername}</td></tr>
            <tr><td style="padding:14px 20px;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">💬</span><strong>Message:</strong> ${riderMessage}</td></tr>
          </table>
          <p style="font-size:0.88rem;line-height:1.6;color:#666;margin:0 0 24px;background:#fff8f0;border-left:3px solid #e8742a;border-radius:0 8px 8px 0;padding:12px 16px;">Log in to <strong>accept or decline within 24 hours.</strong> If you don't respond, the request will expire and the rider will be refunded.</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0;">
              <a href="https://cruisekauai.org/" style="display:inline-block;background:#e8742a;color:#ffffff;text-decoration:none;font-weight:600;font-size:1rem;padding:14px 32px;border-radius:50px;margin:4px 8px;">Accept Ride →</a>
              <a href="https://cruisekauai.org/" style="display:inline-block;background:transparent;color:#e8742a;text-decoration:none;font-weight:600;font-size:0.9rem;padding:12px 28px;border-radius:50px;border:2px solid #e8742a;margin:4px 8px;">View Details</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#faf7f2;border-top:1px solid #ede5d4;padding:20px 32px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:0.95rem;color:#888;font-style:italic;margin:0 0 8px;">Mahalo nui loa 🌺</p>
          <p style="font-size:0.78rem;color:#aaa;line-height:1.6;margin:0;">— The Cruise Kaua'i Team · <a href="https://cruisekauai.org/" style="color:#e8742a;text-decoration:none;">cruisekauai.org</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    await base44.asServiceRole.integrations.Core.SendEmail({ to: driver.email, subject, body });

    // Send SMS if opted in
    if (driver.sms_notifications_enabled && driver.phone_number) {
      await base44.asServiceRole.functions.invoke('sendSmsNotification', {
        userId,
        message: `You've got a rider! ${riderRealName} wants to book your trip ${ride.departure_location} → ${ride.destination} on ${ride.departure_date}. Open the app to accept or decline.`,
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});