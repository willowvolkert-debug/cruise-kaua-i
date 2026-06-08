import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { booking_id, session_id } = await req.json();

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

        // Check if payment was already processed by webhook
        if (booking.payment_status === 'paid') {
            return Response.json({ success: true, already_processed: true });
        }

        // If webhook hasn't processed yet, verify payment with Stripe and process
        if (session_id) {
            try {
                const session = await stripe.checkout.sessions.retrieve(session_id);
                
                if (session.payment_status === 'paid') {
                    // Get ride details
                    const rides = await base44.entities.Ride.filter({ id: booking.ride_id });
                    const ride = rides[0];

                    // Get driver details
                    const drivers = await base44.asServiceRole.entities.User.filter({ id: booking.driver_id });
                    const driver = drivers[0];

                    // Calculate amounts
                    const rideAmount = booking.total_amount;
                    const connectFeeRate = ride?.driver_license_state === 'HI' ? 0.10 : 0.30;
                    const connectFee = rideAmount * connectFeeRate;
                    const totalPaid = session.amount_total / 100;

                    // Seed initial message thread from rider's description
                    const initialMessages = booking.description ? [{
                        sender_id: user.id,
                        sender_name: booking.passenger_name,
                        message: booking.description,
                        timestamp: new Date().toISOString()
                    }] : [];

                    // Update booking payment status + seed message thread
                    await base44.asServiceRole.entities.RideBooking.update(booking_id, {
                        payment_status: 'paid',
                        stripe_charge_id: session.payment_intent,
                        initial_notification_sent: true,
                        ...(initialMessages.length > 0 && (!booking.messages || booking.messages.length === 0) ? { messages: initialMessages } : {})
                    });

                    // Check if transaction already exists
                    const existingTransactions = await base44.asServiceRole.entities.Transaction.filter({ booking_id: booking_id });
                    
                    if (existingTransactions.length === 0) {
                        // Create transaction record
                        await base44.asServiceRole.entities.Transaction.create({
                            booking_id: booking_id,
                            ride_id: booking.ride_id,
                            payer_id: user.id,
                            payer_name: user.full_name,
                            recipient_id: booking.driver_id,
                            recipient_name: driver?.full_name || 'Driver',
                            ride_amount: rideAmount,
                            connect_fee: connectFee,
                            total_amount: totalPaid,
                            payment_method_last4: 'card',
                            payment_method_brand: 'Card',
                            transaction_status: 'completed',
                            stripe_charge_id: session.payment_intent
                        });
                    }

                    // Send notification email + SMS to driver
                    if (driver?.email) {
                        const driverFirstName = driver.full_name?.split(' ')[0] || 'there';
                        const riderUsername = booking.passenger_username || booking.passenger_name;
                        const payoutAmount = `$${rideAmount.toFixed(2)}`;
                        const riderMessage = booking.description || 'No message provided';
                        await base44.integrations.Core.SendEmail({
                            to: driver.email,
                            subject: `You've got a rider! ${booking.passenger_name} wants to book your trip`,
                            body: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td align="center" style="padding:32px 24px 20px;border-bottom:1px solid #f0ebe0;">
          <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Kaua'i" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #e8742a;display:block;margin:0 auto 10px;" />
          <div style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;">Cruise Kaua'i</div>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h1 style="font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#1a1a1a;margin:0 0 12px;">You've got a rider, ${driverFirstName}! 🎉</h1>
          <p style="font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 20px;"><strong>${booking.passenger_name}</strong> has requested a seat on your upcoming drive. They've already paid — you just need to confirm.</p>
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
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">📍</span><strong>Route:</strong> ${ride?.departure_location} → ${ride?.destination}</td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">📅</span><strong>Date:</strong> ${ride?.departure_date} at ${ride?.departure_time}</td></tr>
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
</body></html>`
                        });
                    }
                    if (driver?.sms_notifications_enabled && driver?.phone_number) {
                        await base44.asServiceRole.functions.invoke('sendSmsNotification', {
                            userId: booking.driver_id,
                            message: `Cruise Kauaʻi: New ride request from ${booking.passenger_name}! Log in to accept or decline: https://cruisekauai.org`
                        });
                    }
                }
            } catch (stripeError) {
                console.error('Stripe session retrieval error:', stripeError);
            }
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Payment success handler error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});