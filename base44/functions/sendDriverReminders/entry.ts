import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Get all confirmed bookings
        const allBookings = await base44.asServiceRole.entities.RideBooking.filter({ 
            booking_status: 'confirmed' 
        });
        const allUsers = await base44.asServiceRole.entities.User.list();
        const allRides = await base44.asServiceRole.entities.Ride.list();

        const now = new Date();
        // Tomorrow window: between 20 and 28 hours from now
        const tomorrowStart = new Date(now.getTime() + 20 * 60 * 60 * 1000);
        const tomorrowEnd = new Date(now.getTime() + 28 * 60 * 60 * 1000);

        const notifications = [];

        for (const booking of allBookings) {
            const ride = allRides.find(r => r.id === booking.ride_id);
            if (!ride || !ride.departure_date || !ride.departure_time) continue;

            // Parse ride departure datetime
            const [year, month, day] = ride.departure_date.split('-').map(Number);
            const timeParts = ride.departure_time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
            if (!timeParts) continue;
            let hours = parseInt(timeParts[1]);
            const minutes = parseInt(timeParts[2]);
            const ampm = timeParts[3];
            if (ampm) {
                if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
            }
            const rideDateTime = new Date(year, month - 1, day, hours, minutes);

            // Check if ride is tomorrow
            if (rideDateTime < tomorrowStart || rideDateTime > tomorrowEnd) continue;

            const driver = allUsers.find(u => u.id === booking.driver_id);
            const passenger = allUsers.find(u => u.id === booking.passenger_id);

            const rideDate = ride.departure_date;
            const rideTime = ride.departure_time;
            const origin = ride.departure_location;
            const destination = ride.destination;
            const seats = booking.seats_booked;

            const buildEmail = (recipientFirstName, otherPersonName, role, completionAction) => `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td align="center" style="padding:32px 24px 20px;border-bottom:1px solid #f0ebe0;">
          <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Hawaiʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #e8742a;display:block;margin:0 auto 10px;" />
          <div style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;">Cruise Hawaiʻi</div>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h1 style="font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#1a1a1a;margin:0 0 12px;">Your ride is tomorrow! ⏰</h1>
          <p style="font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 20px;">Just a heads up, <strong>${recipientFirstName}</strong> — your confirmed trip with <strong>${otherPersonName}</strong> is coming up soon. Here are the details:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border-radius:12px;margin:0 0 20px;">
            <tr><td style="padding:16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" width="30%">
                    <div style="width:36px;height:36px;border-radius:50%;background:#2d6a4f;color:white;line-height:36px;text-align:center;font-size:0.9rem;margin:0 auto 6px;">✓</div>
                    <div style="font-size:0.72rem;color:#666;line-height:1.3;">Ride<br>Confirmed</div>
                  </td>
                  <td align="center" width="5%"><div style="height:2px;background:#ddd;width:100%;"></div></td>
                  <td align="center" width="30%">
                    <div style="width:36px;height:36px;border-radius:50%;background:#e8742a;color:white;line-height:36px;text-align:center;font-size:0.9rem;margin:0 auto 6px;">🚗</div>
                    <div style="font-size:0.72rem;color:#666;line-height:1.3;">Trip<br>Tomorrow</div>
                  </td>
                  <td align="center" width="5%"><div style="height:2px;background:#ddd;width:100%;"></div></td>
                  <td align="center" width="30%">
                    <div style="width:36px;height:36px;border-radius:50%;background:#ddd;color:#999;line-height:36px;text-align:center;font-size:0.9rem;margin:0 auto 6px;">✓</div>
                    <div style="font-size:0.72rem;color:#aaa;line-height:1.3;">Confirm<br>Complete</div>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid #ede5d4;border-radius:12px;margin:0 0 20px;">
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">📍</span><strong>Route:</strong> ${origin} → ${destination}</td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">📅</span><strong>When:</strong> ${rideDate} at ${rideTime}</td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">🪑</span><strong>Seats:</strong> ${seats}</td></tr>
            <tr><td style="padding:14px 20px;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">🤝</span><strong>Your ${role}:</strong> ${otherPersonName}</td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border-left:3px solid #e8742a;border-radius:0 8px 8px 0;margin:0 0 24px;">
            <tr><td style="padding:12px 16px;font-size:0.88rem;color:#555;line-height:1.6;">
              🌺 <strong>After your trip:</strong> Don't forget to mark it complete in the app so your <strong>${completionAction}</strong>. It only takes a second.
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0;">
              <a href="https://cruisekauai.org/" style="display:inline-block;background:#e8742a;color:#ffffff;text-decoration:none;font-weight:600;font-size:1rem;padding:14px 36px;border-radius:50px;">View Trip Details →</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#faf7f2;border-top:1px solid #ede5d4;padding:20px 32px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:0.95rem;color:#888;font-style:italic;margin:0 0 8px;">Mahalo nui loa 🌺</p>
          <p style="font-size:0.78rem;color:#aaa;line-height:1.6;margin:0;">— The Cruise Hawaiʻi Team · <a href="https://cruisekauai.org/" style="color:#e8742a;text-decoration:none;">cruisekauai.org</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

            // Send to driver
            if (driver?.email) {
                const driverFirstName = driver.full_name?.split(' ')[0] || 'there';
                const passengerName = booking.passenger_name || passenger?.full_name || 'your rider';
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: driver.email,
                    subject: `Your ride is tomorrow: ${origin} → ${destination}`,
                    body: buildEmail(driverFirstName, passengerName, 'rider', 'payout gets released')
                });
                notifications.push({ to: driver.email, role: 'driver', booking_id: booking.id });
            }

            // Send to passenger
            if (passenger?.email) {
                const passengerFirstName = passenger.full_name?.split(' ')[0] || 'there';
                const driverName = ride.driver_name || driver?.full_name || 'your driver';
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: passenger.email,
                    subject: `Your ride is tomorrow: ${origin} → ${destination}`,
                    body: buildEmail(passengerFirstName, driverName, 'driver', 'driver gets paid')
                });
                notifications.push({ to: passenger.email, role: 'passenger', booking_id: booking.id });
            }
        }

        return Response.json({ 
            success: true, 
            reminders_sent: notifications.length,
            details: notifications 
        });
    } catch (error) {
        console.error('Error sending reminders:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});