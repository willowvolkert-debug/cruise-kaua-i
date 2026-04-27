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
                        body: `<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
<h2 style="color:#3b82f6;">Hi ${driver.full_name || 'Driver'} 👋</h2>
<p>You have a pending ride request waiting for your response!</p>
<p><strong>Rider:</strong> ${booking.passenger_name}<br/>
<strong>Seats requested:</strong> ${booking.seats_booked}<br/>
<strong>Amount:</strong> $${booking.total_amount}</p>
${booking.description ? `<p><strong>Rider's message:</strong> "${booking.description}"</p>` : ''}
<p>Please log into Cruise Kauaʻi to accept or decline this request:</p>
<p><a href="https://cruisekauai.base44.app" style="background-color:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Open Cruise Kauaʻi →</a></p>
<p>Mahalo,<br/>Cruise Kauaʻi Team</p>
</body></html>`
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