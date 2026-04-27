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
                        body: `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px;">

<h2 style="color:#3b82f6;margin-bottom:16px;">Hi ${driver.full_name || 'Driver'} 👋</h2>

<p style="margin-bottom:16px;">You have a pending ride request waiting for your response!</p>

<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px;">
  <p style="margin:0 0 8px 0;"><strong>Rider:</strong> ${booking.passenger_name}</p>
  <p style="margin:0 0 8px 0;"><strong>Seats requested:</strong> ${booking.seats_booked}</p>
  <p style="margin:0;"><strong>Amount:</strong> $${booking.total_amount}</p>
  ${booking.description ? `<p style="margin:8px 0 0 0;"><strong>Rider's message:</strong> "${booking.description}"</p>` : ''}
</div>

<p style="margin-bottom:20px;">Please log into Cruise Kauaʻi to accept or decline this request:</p>

<p style="margin-bottom:32px;">
  <a href="https://cruisekauai.base44.app" style="background-color:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Open Cruise Kauaʻi →</a>
</p>

<p style="margin-bottom:4px;">Mahalo,</p>
<p style="margin:0;"><strong>Cruise Kauaʻi Team</strong></p>

<hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;">
<p style="font-size:13px;color:#666;margin-bottom:8px;">Not sure how to use the app? <a href="https://cruisekauai.base44.app/Welcome" style="color:#3b82f6;">Re-watch our welcome flow here</a>.</p>
<p style="font-size:12px;color:#999;margin:0;">Replies to this email are not monitored. Please use the Contact Us form on the app or email willowvolkert@gmail.com with any questions.</p>

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