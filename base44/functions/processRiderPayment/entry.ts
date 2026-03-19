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

        // Get rider's payment method - search by user_id and is_default, or by specific ID
        let paymentMethod;
        if (booking.payment_method_id) {
            const paymentMethods = await base44.asServiceRole.entities.PaymentMethod.filter({ 
                id: booking.payment_method_id 
            });
            paymentMethod = paymentMethods[0];
        }
        
        // If no specific payment method, get the rider's default payment method
        if (!paymentMethod) {
            const riderPaymentMethods = await base44.asServiceRole.entities.PaymentMethod.filter({ 
                user_id: booking.passenger_id,
                is_default: true
            });
            paymentMethod = riderPaymentMethods[0];
        }

        // Still no payment method? Get any payment method for this rider
        if (!paymentMethod) {
            const allRiderPaymentMethods = await base44.asServiceRole.entities.PaymentMethod.filter({ 
                user_id: booking.passenger_id
            });
            paymentMethod = allRiderPaymentMethods[0];
        }

        if (!paymentMethod || !paymentMethod.stripe_payment_method_id) {
            return Response.json({ error: 'Rider has no valid payment method saved. Please ask them to add a card.' }, { status: 400 });
        }

        // Get rider info to find or create Stripe customer
        const riders = await base44.asServiceRole.entities.User.filter({ id: booking.passenger_id });
        const rider = riders[0];

        if (!rider) {
            return Response.json({ error: 'Rider not found' }, { status: 404 });
        }

        // Get or create Stripe customer for the rider
        let customerId = rider.stripe_customer_id;
        
        if (!customerId) {
            // Create a new Stripe customer
            const customer = await stripe.customers.create({
                email: rider.email,
                name: rider.full_name,
                metadata: {
                    user_id: rider.id
                }
            });
            customerId = customer.id;
            
            // Save customer ID to user record
            await base44.asServiceRole.entities.User.update(rider.id, {
                stripe_customer_id: customerId
            });
        }

        // Attach payment method to customer if not already attached
        try {
            await stripe.paymentMethods.attach(paymentMethod.stripe_payment_method_id, {
                customer: customerId
            });
        } catch (attachError) {
            // If already attached, that's fine
            if (!attachError.message.includes('already been attached')) {
                console.error('Error attaching payment method:', attachError);
            }
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
            customer: customerId,
            payment_method: paymentMethod.stripe_payment_method_id,
            confirm: true,
            off_session: true,
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