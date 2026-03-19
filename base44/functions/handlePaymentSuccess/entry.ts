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

                    // Update booking payment status
                    await base44.entities.RideBooking.update(booking_id, {
                        payment_status: 'paid',
                        stripe_charge_id: session.payment_intent,
                        initial_notification_sent: true
                    });

                    // Check if transaction already exists
                    const existingTransactions = await base44.entities.Transaction.filter({ booking_id: booking_id });
                    
                    if (existingTransactions.length === 0) {
                        // Create transaction record
                        await base44.entities.Transaction.create({
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

                    // Send notification email to driver
                    if (driver?.email) {
                        await base44.integrations.Core.SendEmail({
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