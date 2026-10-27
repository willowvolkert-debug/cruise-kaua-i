import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { rider_id, rider_name, rider_username, request_id, message } = body;

    const driver = await base44.auth.me();
    if (!driver) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!rider_id || !message?.trim()) {
      return Response.json({ error: 'rider_id and message are required' }, { status: 400 });
    }

    // Look up the rider's email (service role can list all users)
    let riderEmail = '';
    try {
      const allUsers = await base44.asServiceRole.entities.User.list();
      const rider = allUsers.find(u => String(u.id) === String(rider_id));
      riderEmail = rider?.email || '';
    } catch (e) {
      // Non-critical — email notification is best-effort
    }

    const newMessage = {
      sender_id: driver.id,
      sender_name: driver.full_name,
      message,
      timestamp: new Date().toISOString()
    };

    // Find an existing ride-request reply booking between this driver and rider, or create one.
    // Service role bypasses RideBooking create RLS (which only allows the passenger to create).
    const bookings = await base44.asServiceRole.entities.RideBooking.filter({
      passenger_id: rider_id,
      driver_id: driver.id
    });

    let booking;
    if (bookings.length > 0) {
      booking = bookings[0];
      const updatedMessages = [...(booking.messages || []), newMessage];
      await base44.asServiceRole.entities.RideBooking.update(booking.id, {
        messages: updatedMessages,
        booking_status: 'confirmed'
      });
    } else {
      // ride_id prefixed with 'ride-request-' + total_amount 0 + confirmed makes this a
      // "ride-request reply" booking, which the Inbox shows for both driver and rider.
      booking = await base44.asServiceRole.entities.RideBooking.create({
        ride_id: 'ride-request-' + (request_id || rider_id),
        driver_id: driver.id,
        driver_name: driver.full_name,
        driver_username: driver.username || driver.full_name,
        passenger_id: rider_id,
        passenger_name: rider_name || 'Rider',
        passenger_username: rider_username || '',
        seats_booked: 1,
        total_amount: 0,
        booking_status: 'confirmed',
        description: 'Driver responded to ride request',
        messages: [newMessage],
        initial_notification_sent: true
      });
    }

    // Best-effort email notification to the rider
    if (riderEmail) {
      try {
        const appUrl = 'https://www.cruisekauai.org';
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: riderEmail,
          subject: `🌺 A driver responded to your ride request on Cruise Hawaiʻi!`,
          body: `<html><body style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
<p>Aloha ${rider_name || ''},</p>
<p>A driver has seen your ride request and sent you a message on Cruise Hawaiʻi!</p>
<p style="background: #f5f5f5; padding: 16px; border-radius: 8px; font-style: italic;">"${message}"</p>
<p>Log in to the app to chat with them and book your ride: <a href="${appUrl}">${appUrl}</a></p>
<p>Mahalo,<br/>Cruise Hawaiʻi Team</p>
</body></html>`
        });
      } catch (e) {
        // Non-critical
      }
    }

    return Response.json({ success: true, bookingId: booking.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});