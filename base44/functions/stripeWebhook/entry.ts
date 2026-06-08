import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
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
            const booking = await base44.asServiceRole.entities.RideBooking.get(booking_id);

            if (!booking) {
                console.error('Booking not found:', booking_id);
                return Response.json({ error: 'Booking not found' }, { status: 404 });
            }

            // Get ride details
            const ride = await base44.asServiceRole.entities.Ride.get(ride_id);

            // Get driver details
            const driver = await base44.asServiceRole.entities.User.get(driver_id);

            // Get passenger details
            const passenger = await base44.asServiceRole.entities.User.get(passenger_id);

            // Calculate amounts from the session
            const totalPaid = session.amount_total / 100; // Convert from cents
            const rideAmount = booking.total_amount; // This is the ride cost without connect fee
            const connectFeeRate = ride?.driver_license_state === 'HI' ? 0.10 : 0.30;
            const connectFee = rideAmount * connectFeeRate;

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

            // Create transaction record
            // The ride_amount goes to driver, connect_fee goes to business
            await base44.asServiceRole.entities.Transaction.create({
                booking_id: booking_id,
                ride_id: ride_id,
                payer_id: passenger_id,
                payer_name: passenger?.full_name || booking.passenger_name,
                recipient_id: driver_id,
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
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: driver.email,
                        subject: `🚗 New ride request from ${booking.passenger_name}!`,
                        body: `
Hi ${driver.full_name || 'Driver'},

You have a new ride request! The rider has already paid.

Rider: ${booking.passenger_name} (@${booking.passenger_username || 'user'})
Seats requested: ${booking.seats_booked}
Your payout: $${rideAmount.toFixed(2)} (after the rider confirms the trip)

${booking.description ? `Rider's message: "${booking.description}"` : ''}

Please log into Cruise Kauaʻi to accept or decline this request.

Mahalo,
Cruise Kauaʻi Team
                        `.trim()
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