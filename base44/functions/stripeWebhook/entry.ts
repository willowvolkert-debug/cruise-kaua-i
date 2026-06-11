import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe';

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
            const connectFeeRate = ride?.driver_license_state === 'HI' ? 0.10 : 0.30;
            const connectFee = rideAmount * connectFeeRate;

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
                connect_fee: connectFee, // This amount goes to Cruise Kauaʻi business
                total_amount: totalPaid,
                payment_method_last4: session.payment_method_types?.[0] || 'card',
                payment_method_brand: 'Card',
                transaction_status: 'completed',
                stripe_charge_id: session.payment_intent
            });

            // Send notification email to driver
            if (driver?.email) {
                try {
                    let emailBody = `Hi ${driver.full_name || 'Driver'},\n\nYou have a new ride request! The rider has already paid.\n\nRider: ${booking.passenger_name} (@${booking.passenger_username || 'user'})\nSeats requested: ${booking.seats_booked}\n`;

                    // If price offer was used, show pricing details and action buttons
                    if (booking.is_price_offer) {
                        const originalPrice = ride?.price_per_seat || 0;
                        const offeredPrice = booking.offered_price || 0;
                        emailBody += `\n⚠️ PRICE OFFER USED\nYour asking price: $${originalPrice.toFixed(2)} per seat\nRider offered: $${offeredPrice.toFixed(2)} per seat\nYour payout if accepted: $${rideAmount.toFixed(2)}\n`;
                        emailBody += `\nWhat would you like to do?\n1. Accept the offer: https://www.cruisekauai.org/inbox?action=accept_offer&booking_id=${booking_id}\n2. Request full fare: https://www.cruisekauai.org/inbox?action=request_full_fare&booking_id=${booking_id}\n3. Deny request: https://www.cruisekauai.org/inbox?action=deny_request&booking_id=${booking_id}\n`;
                    } else {
                        emailBody += `Your payout: $${rideAmount.toFixed(2)} (after the rider confirms the trip)\n`;
                    }

                    if (booking.description) {
                        emailBody += `\nRider's message: "${booking.description}"\n`;
                    }

                    emailBody += `\nPlease log into Cruise Kauaʻi to accept or decline this request.\n\nMahalo,\nCruise Kauaʻi Team`;

                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: driver.email,
                        subject: booking.is_price_offer ? `💰 Price offer received from ${booking.passenger_name}!` : `🚗 New ride request from ${booking.passenger_name}!`,
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