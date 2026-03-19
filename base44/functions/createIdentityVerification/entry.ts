import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.7.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the app URL for return redirect
        const origin = req.headers.get('origin') || 'https://cruise-kauai-ride.base44.app';

        // Create a verification session using the provided verification flow
        const verificationSession = await stripe.identity.verificationSessions.create({
            verification_flow: 'vf_1SZ2yuL2Hto7mYsihs9bBHbi',
            return_url: `${origin}/Account?verification=submitted`,
            metadata: {
                user_id: user.id,
                user_email: user.email
            }
        });

        // Mark user as having pending license review
        await base44.asServiceRole.entities.User.update(user.id, {
            drivers_license_pending_review: true,
            stripe_verification_session_id: verificationSession.id
        });

        return Response.json({ 
            url: verificationSession.url,
            session_id: verificationSession.id
        });
    } catch (error) {
        console.error("Error creating verification session:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});