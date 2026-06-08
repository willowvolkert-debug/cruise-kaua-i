import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is admin
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Send test email with price offer example
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: "willowvolkert@gmail.com",
            subject: "💰 Price offer received from passenger!",
            body: `Hi Driver,

You have a new ride request! The rider has already paid.

Rider: John Doe (@johndoe)
Seats requested: 2

⚠️ PRICE OFFER USED
Your asking price: $45.00 per seat
Rider offered: $35.00 per seat
Your payout if accepted: $70.00

What would you like to do?
1. Accept the offer: https://www.cruisekauai.org/inbox?action=accept_offer&booking_id=booking_123
2. Request full fare: https://www.cruisekauai.org/inbox?action=request_full_fare&booking_id=booking_123
3. Deny request: https://www.cruisekauai.org/inbox?action=deny_request&booking_id=booking_123

Rider's message: "Hi! I'm a local student traveling to work. Would love to share the ride!"

Please log into Cruise Kauaʻi to accept or decline this request.

Mahalo,
Cruise Kauaʻi Team`
        });

        return Response.json({ success: true, message: 'Test email sent to willowvolkert@gmail.com' });
    } catch (error) {
        console.error('Error sending test email:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});