import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { booking_id } = await req.json();

        if (!booking_id) {
            return Response.json({ error: 'Booking ID required' }, { status: 400 });
        }

        // Get booking
        const bookings = await base44.entities.RideBooking.filter({ id: booking_id });
        const booking = bookings[0];

        if (!booking) {
            return Response.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Verify this user is the passenger
        if (booking.passenger_id !== user.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Update booking payment status
        await base44.entities.RideBooking.update(booking_id, {
            payment_status: 'paid',
            initial_notification_sent: true
        });

        // Send notification email to driver
        const drivers = await base44.asServiceRole.entities.User.filter({ id: booking.driver_id });
        const driver = drivers[0];

        if (driver && driver.email) {
            await base44.integrations.Core.SendEmail({
                to: driver.email,
                subject: `🚗 New ride request from ${booking.passenger_name}!`,
                body: `
Hi ${driver.full_name || 'Driver'},

You have a new ride request! The rider has already paid.

Rider: ${booking.passenger_name} (@${booking.passenger_username || 'user'})
Seats requested: ${booking.seats_booked}
Amount: $${booking.total_amount}

${booking.description ? `Rider's message: "${booking.description}"` : ''}

Please log into Cruise Kauaʻi to accept or decline this request.

Mahalo,
Cruise Kauaʻi Team
                `.trim()
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Payment success handler error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});