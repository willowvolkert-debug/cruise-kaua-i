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

        const { booking_id } = await req.json();

        if (!booking_id) {
            return Response.json({ error: 'Booking ID required' }, { status: 400 });
        }

        // Get booking details
        const bookings = await base44.asServiceRole.entities.RideBooking.filter({ id: booking_id });
        const booking = bookings[0];

        if (!booking) {
            return Response.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Verify this user is the driver (only driver can trigger payment)
        if (booking.driver_id !== user.id) {
            return Response.json({ error: 'Only the driver can accept this request' }, { status: 403 });
        }

        // Get rider's payment method
        const paymentMethods = await base44.asServiceRole.entities.PaymentMethod.filter({ 
            id: booking.payment_method_id 
        });
        const paymentMethod = paymentMethods[0];

        if (!paymentMethod) {
            return Response.json({ error: 'Rider payment method not found' }, { status: 400 });
        }

        // Get ride details for fee calculation
        const rides = await base44.asServiceRole.entities.Ride.filter({ id: booking.ride_id });
        const ride = rides[0];
        
        const baseAmount = booking.total_amount;
        const connectFeeRate = ride?.driver_license_state === 'HI' ? 0.10 : 0.30;
        const connectFee = baseAmount * connectFeeRate;
        const totalAmount = baseAmount + connectFee;

        // Create and confirm payment intent with the rider's saved payment method
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100), // Convert to cents
            currency: 'usd',
            payment_method: paymentMethod.stripe_payment_method_id,
            confirm: true,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never'
            },
            metadata: {
                booking_id: booking_id,
                ride_id: booking.ride_id,
                passenger_id: booking.passenger_id,
                driver_id: booking.driver_id
            },
            description: `Cruise Kauaʻi ride - ${booking.passenger_name}`
        });

        if (paymentIntent.status === 'succeeded') {
            return Response.json({
                success: true,
                paymentIntentId: paymentIntent.id,
                amount: totalAmount,
                last4: paymentMethod.card_last4,
                brand: paymentMethod.card_brand,
                connectFee: connectFee
            });
        } else {
            return Response.json({ 
                error: 'Payment failed', 
                status: paymentIntent.status 
            }, { status: 400 });
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});