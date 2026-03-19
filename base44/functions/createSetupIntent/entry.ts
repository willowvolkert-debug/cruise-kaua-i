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

        // Check if customer already exists
        let customerId = user.stripe_customer_id;
        
        if (!customerId) {
            // Create a new Stripe customer
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.full_name,
                metadata: {
                    user_id: user.id
                }
            });
            customerId = customer.id;
            
            // Save customer ID to user
            await base44.asServiceRole.entities.User.update(user.id, {
                stripe_customer_id: customerId
            });
        }

        // Create a SetupIntent for saving the payment method
        const setupIntent = await stripe.setupIntents.create({
            customer: customerId,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never'
            },
            metadata: {
                user_id: user.id
            }
        });

        return Response.json({
            clientSecret: setupIntent.client_secret,
            customerId: customerId
        });
    } catch (error) {
        console.error('Stripe error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});