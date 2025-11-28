import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get all pending bookings
        const allBookings = await base44.asServiceRole.entities.RideBooking.filter({ 
            booking_status: 'pending' 
        });

        const now = new Date();
        const notifications = [];

        for (const booking of allBookings) {
            const createdAt = new Date(booking.created_date);
            const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
            
            // Check if we should send a reminder
            // Initial notification at 1 hour, then every 2 hours (1, 3, 5, 7...)
            const reminderCount = booking.reminder_count || 0;
            
            let shouldRemind = false;
            if (reminderCount === 0 && hoursSinceCreation >= 1) {
                shouldRemind = true;
            } else if (reminderCount > 0) {
                // After first reminder at 1 hour, reminders at 3, 5, 7... hours
                const nextReminderHour = 1 + (reminderCount * 2);
                if (hoursSinceCreation >= nextReminderHour) {
                    shouldRemind = true;
                }
            }

            if (shouldRemind) {
                // Get driver info
                const drivers = await base44.asServiceRole.entities.User.filter({ 
                    id: booking.driver_id 
                });
                const driver = drivers[0];

                if (driver && driver.email) {
                    // Send email reminder
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: driver.email,
                        subject: `🚗 Pending ride request from ${booking.passenger_name}`,
                        body: `
Hi ${driver.full_name || 'Driver'},

You have a pending ride request waiting for your response!

Rider: ${booking.passenger_name}
Seats requested: ${booking.seats_booked}
Amount: $${booking.total_amount}

Please log into Cruise Kauaʻi to accept or decline this request.

${booking.description ? `Rider's message: "${booking.description}"` : ''}

Mahalo,
Cruise Kauaʻi Team
                        `.trim()
                    });

                    // Update reminder count
                    await base44.asServiceRole.entities.RideBooking.update(booking.id, {
                        reminder_count: reminderCount + 1,
                        last_reminder_date: now.toISOString()
                    });

                    notifications.push({
                        booking_id: booking.id,
                        driver_email: driver.email,
                        reminder_number: reminderCount + 1
                    });
                }
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