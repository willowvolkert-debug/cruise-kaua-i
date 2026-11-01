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

        const { 
            ride_id, 
            seats_booked, 
            base_amount, 
            detour_fee,
            description,
            has_luggage,
            wants_detour_service,
            detour_destination,
            is_partial_ride,
            partial_from,
            partial_to,
            is_price_offer,
            offered_price,
            driver_id,
            driver_username,
            success_url,
            cancel_url
        } = await req.json();

        if (!ride_id || base_amount == null) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get ride details
        const rides = await base44.entities.Ride.filter({ id: ride_id });
        const ride = rides[0];

        if (!ride) {
            return Response.json({ error: 'Ride not found' }, { status: 404 });
        }

        // Format ride date/time for Stripe metadata (simple, no timezone math)
        const hawaiiDateStr = ride.departure_date || '';
        const hawaiiTimeStr = ride.departure_time || '';



        // Check if this is user's first COMPLETED PAYMENT
        // Use asServiceRole to ensure we get all bookings for this user across the platform
        const existingBookings = await base44.asServiceRole.entities.RideBooking.list();
        const hasCompletedPayments = existingBookings.some(b => 
            String(b.passenger_id) === String(user.id) && b.payment_status === 'paid'
        );
        const isFirstBooking = !hasCompletedPayments;

        // Calculate fees
        const rideAmount = base_amount + (detour_fee || 0);
        const connectFee = carpoolConnectFee(user.has_hawaii_id === true, rideAmount);
        const isFreeRide = !(rideAmount > 0);
        // Free rides always carry the $1.50 ID fee; paid rides only on the rider's first booking
        const licenseVerificationFee = (isFreeRide || isFirstBooking) ? 1.50 : 0;
        const smsFee = (user.sms_notifications_enabled && !isFreeRide) ? 0.50 : 0;
        const subtotal = rideAmount + connectFee + licenseVerificationFee + smsFee;
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
            is_partial_ride: is_partial_ride || false,
            partial_from: partial_from || '',
            partial_to: partial_to || '',
            is_price_offer: is_price_offer || false,
            offered_price: offered_price || null,
            price_offer_status: is_price_offer ? 'pending' : null,
            messages: [],
            initial_notification_sent: false,
            // Passenger profile info for driver to review
            passenger_profile_picture_url: user.profile_picture_url || null,
            passenger_bio: user.bio || null,
            passenger_age: user.age || null,
            passenger_gender: user.gender || null,
            passenger_preferences_chattiness: user.preferences_chattiness || null,
            passenger_preferences_scents: user.preferences_scents || null,
            license_pending: !user.drivers_license_verified,
        });

        // Build line items
        const lineItems = [];

        if (!isFreeRide) {
            lineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Cruise Hawaiʻi Ride`,
                        description: `${ride.departure_location} → ${ride.destination} on ${hawaiiDateStr} at ${hawaiiTimeStr} HST · ${seats_booked} seat${seats_booked > 1 ? 's' : ''}`
                    },
                    unit_amount: Math.round(rideAmount * 100)
                },
                quantity: 1
            });
            lineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Connect Fee',
                        description: `Cruise Hawaiʻi service fee (flat per ride)`
                    },
                    unit_amount: Math.round(connectFee * 100)
                },
                quantity: 1
            });
        }

        // Add ID fee (free rides, or first-time riders)
        if (licenseVerificationFee > 0) {
            lineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'ID Fee',
                        description: isFreeRide ? 'ID verification fee for free rides' : 'One-time Stripe identity verification fee'
                    },
                    unit_amount: Math.round(licenseVerificationFee * 100)
                },
                quantity: 1
            });
        }

        // Add SMS fee for users opted into SMS notifications
        if (smsFee > 0) {
            lineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'SMS Notification Fee',
                        description: 'SMS ride alerts & notifications'
                    },
                    unit_amount: Math.round(smsFee * 100)
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