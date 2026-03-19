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

        const { refresh_url, return_url } = await req.json();

        // Check if user already has a Connect account
        if (user.stripe_connect_account_id) {
            // Create account link for existing account
            const accountLink = await stripe.accountLinks.create({
                account: user.stripe_connect_account_id,
                refresh_url: refresh_url,
                return_url: return_url,
                type: 'account_onboarding',
            });

            return Response.json({
                success: true,
                url: accountLink.url,
                account_id: user.stripe_connect_account_id
            });
        }

        // Create new Connect account
        const account = await stripe.accounts.create({
            type: 'express',
            email: user.email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_type: 'individual',
            metadata: {
                user_id: user.id,
                user_email: user.email,
                user_name: user.full_name
            }
        });

        // Save Connect account ID to user
        await base44.auth.updateMe({
            stripe_connect_account_id: account.id
        });

        // Create account link for onboarding
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: refresh_url,
            return_url: return_url,
            type: 'account_onboarding',
        });

        return Response.json({
            success: true,
            url: accountLink.url,
            account_id: account.id
        });
    } catch (error) {
        console.error('Connect account creation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});