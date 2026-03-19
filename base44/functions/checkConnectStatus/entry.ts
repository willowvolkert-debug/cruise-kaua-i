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

        if (!user.stripe_connect_account_id) {
            return Response.json({
                success: true,
                onboarding_complete: false,
                charges_enabled: false,
                payouts_enabled: false
            });
        }

        // Retrieve account status from Stripe
        const account = await stripe.accounts.retrieve(user.stripe_connect_account_id);

        const onboardingComplete = account.details_submitted && 
                                   account.charges_enabled && 
                                   account.payouts_enabled;

        // Update user if onboarding is now complete
        if (onboardingComplete && !user.stripe_connect_onboarding_complete) {
            await base44.auth.updateMe({
                stripe_connect_onboarding_complete: true,
                bank_account_linked: true
            });
        }

        return Response.json({
            success: true,
            onboarding_complete: onboardingComplete,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted
        });
    } catch (error) {
        console.error('Connect status check error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});