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

        // Create a verification session using the provided flow ID
        const verificationSession = await stripe.identity.verificationSessions.create({
            type: 'document',
            provided_details: {
                email: user.email,
            },
            metadata: {
                user_id: user.id,
                user_email: user.email
            },
            options: {
                document: {
                    require_matching_selfie: true,
                }
            }
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