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

        const { 
            ride_id, 
            seats_booked, 
            base_amount, 
            detour_fee,
            description,
            has_luggage,
            wants_detour_service,
            detour_destination,
            driver_id,
            driver_username,
            success_url,
            cancel_url
        } = await req.json();

        if (!ride_id || !base_amount) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get ride details
        const rides = await base44.entities.Ride.filter({ id: ride_id });
        const ride = rides[0];

        if (!ride) {
            return Response.json({ error: 'Ride not found' }, { status: 404 });
        }



        // Check if this is user's first PAYMENT (not just booking)
        const existingTransactions = await base44.entities.Transaction.filter({ payer_id: user.id });
        const hasCompletedPayments = existingTransactions.some(t => 
            t.transaction_status === 'completed'
        );
        const isFirstBooking = !hasCompletedPayments;

        // Calculate fees
        const rideAmount = base_amount + (detour_fee || 0);
        const connectFeeRate = ride.driver_license_state === 'HI' ? 0.10 : 0.30;
        const connectFee = rideAmount * connectFeeRate;
        const licenseVerificationFee = isFirstBooking ? 1.50 : 0;
        const subtotal = rideAmount + connectFee + licenseVerificationFee;
        const creditCardFee = subtotal * 0.03;
        const totalAmount = subtotal + creditCardFee;

        // Create a pending booking first
        const booking = await base44.entities.RideBooking.create({
            ride_id: ride_id,
            driver_id: driver_id,
            passenger_id: user.id,
            passenger_name: user.full_name,
            passenger_username: user.username || '',
            driver_username: driver_username || '',
            seats_booked: seats_booked,
            total_amount: rideAmount,
            booking_status: 'pending',
            payment_status: 'pending',
            description: description || '',
            has_luggage: has_luggage || false,
            wants_detour_service: wants_detour_service || false,
            detour_destination: detour_destination || '',
            detour_fee: detour_fee || 0,
            messages: [],
            initial_notification_sent: false
        });

        // Build line items
        const lineItems = [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Cruise Kauaʻi Ride`,
                        description: `${ride.departure_location} → ${ride.destination} (${seats_booked} seat${seats_booked > 1 ? 's' : ''})`
                    },
                    unit_amount: Math.round(rideAmount * 100)
                },
                quantity: 1
            },
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Connect Fee',
                        description: `Cruise Kauaʻi service fee (${Math.round(connectFeeRate * 100)}%)`
                    },
                    unit_amount: Math.round(connectFee * 100)
                },
                quantity: 1
            }
        ];

        // Add license verification fee for first-time riders
        if (isFirstBooking) {
            lineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'License Verification Fee',
                        description: 'One-time Stripe identity verification fee'
                    },
                    unit_amount: Math.round(licenseVerificationFee * 100)
                },
                quantity: 1
            });
        }

        // Add credit card processing fee
        lineItems.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Credit Card Fee',
                    description: 'Payment processing fee (3%)'
                },
                unit_amount: Math.round(creditCardFee * 100)
            },
            quantity: 1
        });

        // Create Stripe Checkout Session - Marketplace pattern (full payment to platform)
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: user.email,
            line_items: lineItems,
            metadata: {
                booking_id: booking.id,
                ride_id: ride_id,
                passenger_id: user.id,
                driver_id: driver_id,
                total_amount: totalAmount.toString()
            },
            success_url: success_url + `?booking_id=${booking.id}&payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancel_url + `?booking_id=${booking.id}&payment=cancelled`
        });

        return Response.json({
            success: true,
            checkout_url: session.url,
            booking_id: booking.id,
            session_id: session.id
        });
    } catch (error) {
        console.error('Checkout creation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});