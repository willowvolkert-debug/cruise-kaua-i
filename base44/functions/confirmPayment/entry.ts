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

        const { paymentIntentId } = await req.json();

        if (!paymentIntentId) {
            return Response.json({ error: 'Payment intent ID required' }, { status: 400 });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        return Response.json({
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            metadata: paymentIntent.metadata
        });
    } catch (error) {
        console.error('Stripe error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});