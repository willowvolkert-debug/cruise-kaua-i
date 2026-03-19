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

        const { payment_method_id } = await req.json();

        if (!payment_method_id) {
            return Response.json({ error: 'Payment method ID required' }, { status: 400 });
        }

        // Get payment method details from Stripe
        const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);

        // Attach to customer if not already
        if (!paymentMethod.customer && user.stripe_customer_id) {
            await stripe.paymentMethods.attach(payment_method_id, {
                customer: user.stripe_customer_id,
            });
        }

        return Response.json({
            success: true,
            card_last4: paymentMethod.card.last4,
            card_brand: paymentMethod.card.brand,
            exp_month: paymentMethod.card.exp_month.toString().padStart(2, '0'),
            exp_year: paymentMethod.card.exp_year.toString().slice(-2),
            stripe_payment_method_id: payment_method_id
        });
    } catch (error) {
        console.error('Stripe error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});