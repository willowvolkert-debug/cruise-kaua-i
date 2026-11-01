import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe';
import { carpoolConnectFee } from '../../shared/fees.ts';

Deno.serve(async (req) => {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    // Initialize base44 client first (before reading body)
    const base44 = createClientFromRequest(req);
     
    try {
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        if (!signature) {
            return Response.json({ error: 'No signature' }, { status: 400 });
        }

        // Verify webhook signature
        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return Response.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Handle failed/expired checkout sessions
        if (event.type === 'checkout.session.expired' || 
            (event.type === 'payment_intent.payment_failed')) {
            const obj = event.data.object;
            // For checkout session expired, metadata is on the session
            // For payment_intent.payment_failed, we need to find the booking by stripe_charge_id
            const bookingId = obj.metadata?.booking_id;
            const failureReason = obj.last_payment_error?.message || 
                                  obj.cancellation_reason || 
                                  'Payment was blocked or failed';

            if (bookingId) {
                await base44.asServiceRole.entities.RideBooking.update(bookingId, {
                    payment_status: 'failed',
                    payment_failure_reason: failureReason
                });
                console.log(`Payment failed for booking ${bookingId}: ${failureReason}`);
            }
            return Response.json({ received: true });
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            // Schoolpool / partypool payments are tracked on PoolBooking
            if (session.metadata?.pool_booking_id) {
                await base44.asServiceRole.entities.PoolBooking.update(session.metadata.pool_booking_id, {
                    payment_status: 'paid',
                    stripe_payment_intent: session.payment_intent,
                });
                return Response.json({ received: true });
            }

            const { booking_id, ride_id, passenger_id, driver_id } = session.metadata;

            if (!booking_id) {
                console.error('No booking_id in session metadata');
                return Response.json({ error: 'Missing booking_id' }, { status: 400 });
            }

            // Get booking details
            const bookings = await base44.asServiceRole.entities.RideBooking.filter({ id: booking_id });
            const booking = bookings[0];

            if (!booking) {
                console.error('Booking not found:', booking_id);
                return Response.json({ error: 'Booking not found' }, { status: 404 });
            }

            // Handle difference payments separately — booking is already 'paid' from the original checkout
            if (session.metadata?.payment_type === 'difference') {
                const diffRides = await base44.asServiceRole.entities.Ride.filter({ id: ride_id });
                const diffRide = diffRides[0];
                const fullPrice = (diffRide?.price_per_seat || 0) * booking.seats_booked;
                await base44.asServiceRole.entities.RideBooking.update(booking_id, {
                    total_amount: fullPrice,
                    price_offer_status: 'accepted',
                    is_price_offer: false
                });
                console.log(`Difference payment processed for booking ${booking_id}. Updated total to $${fullPrice}`);
                return Response.json({ received: true });
            }

            // Get ride details
            const rides = await base44.asServiceRole.entities.Ride.filter({ id: ride_id });
            const ride = rides[0];

            // Use ride's driver_id (the actual ride poster), not the metadata's driver_id
            const actualDriverId = ride?.driver_id || driver_id;

            // Get driver details
            const drivers = await base44.asServiceRole.entities.User.filter({ id: actualDriverId });
            const driver = drivers[0];

            // Get passenger details
            const passengers = await base44.asServiceRole.entities.User.filter({ id: passenger_id });
            const passenger = passengers[0];

            // Calculate amounts from the session
            const totalPaid = session.amount_total / 100; // Convert from cents
            const rideAmount = booking.total_amount; // This is the ride cost without connect fee
            const connectFee = carpoolConnectFee(passenger?.has_hawaii_id === true, rideAmount);

            // Idempotency guard — check BEFORE making any changes
            if (booking.payment_status === 'paid') {
                console.log(`Booking ${booking_id} already marked paid, skipping.`);
                return Response.json({ received: true });
            }

            // Seed initial message thread from rider's description
            const initialMessages = booking.description ? [{
                sender_id: passenger_id,
                sender_name: booking.passenger_name,
                message: booking.description,
                timestamp: new Date().toISOString()
            }] : [];

            // Update booking to paid status + seed message thread
            await base44.asServiceRole.entities.RideBooking.update(booking_id, {
                payment_status: 'paid',
                stripe_charge_id: session.payment_intent,
                initial_notification_sent: true,
                ...(initialMessages.length > 0 && (!booking.messages || booking.messages.length === 0) ? { messages: initialMessages } : {})
            });

            // Guard against duplicate transactions
            const existingTxns = await base44.asServiceRole.entities.Transaction.filter({ booking_id });
            if (existingTxns.length > 0) {
                console.log(`Transaction already exists for booking ${booking_id}, skipping.`);
                return Response.json({ received: true });
            }

            // Create transaction record
            // The ride_amount goes to driver, connect_fee goes to business
            await base44.asServiceRole.entities.Transaction.create({
                booking_id: booking_id,
                ride_id: ride_id,
                payer_id: passenger_id,
                payer_name: passenger?.full_name || booking.passenger_name,
                recipient_id: actualDriverId,
                recipient_name: driver?.full_name || 'Driver',
                ride_amount: rideAmount, // This amount goes to driver
                connect_fee: connectFee, // This amount goes to Cruise Hawaiʻi business
                total_amount: totalPaid,
                payment_method_last4: session.payment_method_types?.[0] || 'card',
                payment_method_brand: 'Card',
                transaction_status: 'completed',
                stripe_charge_id: session.payment_intent
            });

            // Send notification email to driver
            if (driver?.email) {
                try {
                    const driverFirstName = driver.username || driver.full_name?.split(' ')[0] || 'there';
                    const riderUsername = booking.passenger_username || booking.passenger_name;
                    const riderMessage = booking.description || 'No message provided';
                    const payoutDisplay = `$${rideAmount.toFixed(2)}`;

                    let priceOfferBlock = '';
                    if (booking.is_price_offer) {
                        const originalPrice = ride?.price_per_seat || 0;
                        const offeredPrice = booking.offered_price || 0;
                        priceOfferBlock = `
                          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd;border:2px solid #ffc107;border-radius:12px;margin:0 0 20px;">
                            <tr><td style="padding:16px 20px;">
                              <div style="font-weight:700;font-size:0.95rem;color:#856404;margin-bottom:8px;">⚠️ Price Offer</div>
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr><td style="font-size:0.88rem;color:#666;padding:4px 0;">Your asking price:</td><td style="font-size:0.88rem;font-weight:700;color:#333;text-align:right;">$${originalPrice.toFixed(2)}/seat</td></tr>
                                <tr><td style="font-size:0.88rem;color:#666;padding:4px 0;">Rider offered:</td><td style="font-size:0.88rem;font-weight:700;color:#e8742a;text-align:right;">$${offeredPrice.toFixed(2)}/seat</td></tr>
                                <tr><td style="font-size:0.88rem;color:#666;padding:4px 0;border-top:1px solid #ede5d4;padding-top:8px;">Your payout if accepted:</td><td style="font-size:0.95rem;font-weight:700;color:#2f7d52;text-align:right;border-top:1px solid #ede5d4;padding-top:8px;">${payoutDisplay}</td></tr>
                              </table>
                            </td></tr>
                          </table>`;
                    }

                    const payoutBlock = booking.is_price_offer ? '' : `
                          <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff8f0,#fff3e6);border:2px solid #e8742a;border-radius:12px;margin:0 0 20px;">
                            <tr><td style="padding:18px 24px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td width="auto" style="padding-right:16px;">
                                    <div style="font-size:0.7rem;color:#aaa;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">YOUR PAYOUT</div>
                                    <div style="font-family:Georgia,serif;font-size:2.2rem;font-weight:700;color:#e8742a;line-height:1;">${payoutDisplay}</div>
                                  </td>
                                  <td style="font-size:0.82rem;color:#666;line-height:1.5;border-left:1px solid #f0d0b0;padding-left:16px;">Released to you once the rider confirms the trip is complete.<br>The rider has already paid.</td>
                                </tr>
                              </table>
                            </td></tr>
                          </table>`;

                    const emailBody = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td align="center" style="padding:32px 24px 20px;border-bottom:1px solid #f0ebe0;">
          <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Hawaiʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #e8742a;display:block;margin:0 auto 10px;" />
          <div style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;">Cruise Hawaiʻi</div>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h1 style="font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#1a1a1a;margin:0 0 12px;">${booking.is_price_offer ? `Price offer from ${booking.passenger_name} 💰` : `You've got a rider, ${driverFirstName}! 🎉`}</h1>
          <p style="font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 20px;"><strong>${booking.passenger_name}</strong> has requested a seat on your upcoming drive.${booking.is_price_offer ? '' : " They've already paid — you just need to confirm."}</p>
          ${payoutBlock}
          ${priceOfferBlock}
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid #ede5d4;border-radius:12px;margin:0 0 20px;">
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">📍</span><strong>Route:</strong> ${ride?.departure_location || '—'} → ${ride?.destination || '—'}</td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">📅</span><strong>Date:</strong> ${ride?.departure_date || '—'} at ${ride?.departure_time || '—'}</td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">🪑</span><strong>Seats:</strong> ${booking.seats_booked}</td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">🙋</span><strong>Rider:</strong> ${riderUsername}</td></tr>
            <tr><td style="padding:14px 20px;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">💬</span><strong>Message:</strong> ${riderMessage}</td></tr>
          </table>
          <p style="font-size:0.88rem;line-height:1.6;color:#666;margin:0 0 24px;background:#fff8f0;border-left:3px solid #e8742a;border-radius:0 8px 8px 0;padding:12px 16px;">Log in to <strong>accept or decline within 24 hours.</strong> If you don't respond, the request will expire and the rider will be refunded.</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0;">
              <a href="https://cruisekauai.org/inbox" style="display:inline-block;background:#e8742a;color:#ffffff;text-decoration:none;font-weight:600;font-size:1rem;padding:14px 32px;border-radius:50px;margin:4px 8px;">View Request →</a>
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

                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: driver.email,
                        from_name: "Cruise Hawaiʻi",
                        subject: booking.is_price_offer ? `💰 Price offer from ${booking.passenger_name}!` : `🚗 New ride request from ${booking.passenger_name}!`,
                        body: emailBody
                    });
                } catch (emailError) {
                    console.error('Error sending driver notification email:', emailError);
                }
            }

            console.log(`Payment completed for booking ${booking_id}. Ride amount: $${rideAmount}, Connect fee: $${connectFee}`);
        }

        return Response.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});