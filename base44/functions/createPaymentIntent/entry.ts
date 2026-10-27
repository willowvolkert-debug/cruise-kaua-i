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

        const { amount, booking_id, ride_id, description } = await req.json();

        if (!amount || amount <= 0) {
            return Response.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Create a PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            metadata: {
                user_id: user.id,
                user_email: user.email,
                booking_id: booking_id || '',
                ride_id: ride_id || ''
            },
            description: description || 'Cruise Hawaiʻi ride payment',
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return Response.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Stripe error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});