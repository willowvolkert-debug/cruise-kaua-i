import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe';
import { carpoolConnectFee } from '../../shared/fees.ts';

Deno.serve(async (req) => {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { booking_id, success_url, cancel_url } = await req.json();

        if (!booking_id) {
            return Response.json({ error: 'Missing booking_id' }, { status: 400 });
        }

        const bookings = await base44.asServiceRole.entities.RideBooking.filter({ id: booking_id });
        const booking = bookings[0];

        if (!booking) {
            return Response.json({ error: 'Booking not found' }, { status: 404 });
        }

        if (String(booking.passenger_id) !== String(user.id)) {
            return Response.json({ error: 'Only the passenger can pay the difference' }, { status: 403 });
        }

        if (booking.price_offer_status !== 'driver_requesting_full') {
            return Response.json({ error: 'This booking does not require a difference payment' }, { status: 400 });
        }

        const rides = await base44.asServiceRole.entities.Ride.filter({ id: booking.ride_id });
        const ride = rides[0];

        if (!ride) {
            return Response.json({ error: 'Ride not found' }, { status: 404 });
        }

        const fullPrice = (ride.price_per_seat || 0) * booking.seats_booked;
        const alreadyPaid = (booking.offered_price || 0) * booking.seats_booked;
        const differenceAmount = Math.max(0, fullPrice - alreadyPaid);

        if (differenceAmount <= 0) {
            return Response.json({ error: 'No difference to pay' }, { status: 400 });
        }

        const connectFee = carpoolConnectFee(user.has_hawaii_id === true, differenceAmount);
        const subtotal = differenceAmount + connectFee;
        const creditCardFee = subtotal * 0.03;
        const totalAmount = subtotal + creditCardFee;

        const lineItems = [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Price Difference Payment',
                        description: `${ride.departure_location} → ${ride.destination} · ${booking.seats_booked} seat${booking.seats_booked > 1 ? 's' : ''}`
                    },
                    unit_amount: Math.round(differenceAmount * 100)
                },
                quantity: 1
            },
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Connect Fee',
                        description: `Cruise Hawaiʻi service fee (flat per ride)`
                    },
                    unit_amount: Math.round(connectFee * 100)
                },
                quantity: 1
            },
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Credit Card Fee',
                        description: 'Payment processing fee (3%)'
                    },
                    unit_amount: Math.round(creditCardFee * 100)
                },
                quantity: 1
            }
        ];

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: user.email,
            line_items: lineItems,
            metadata: {
                booking_id: booking.id,
                ride_id: booking.ride_id,
                passenger_id: user.id,
                driver_id: booking.driver_id,
                payment_type: 'difference',
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
        console.error('Difference checkout creation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});