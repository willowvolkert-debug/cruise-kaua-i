import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is admin
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Send test email with price offer example - HTML formatted
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: "willowvolkert@gmail.com",
            subject: "💰 Price offer received from passenger!",
            body: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Nunito', Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 24px; }
        .header h1 { color: #2D5F4C; margin: 0; font-size: 24px; }
        .info-box { background: #E8F5E9; border-left: 4px solid #2D5F4C; padding: 16px; margin: 20px 0; border-radius: 8px; }
        .price-comparison { background: #FFF3E0; border: 2px solid #FF9800; padding: 20px; border-radius: 12px; margin: 20px 0; }
        .price-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 16px; }
        .price-label { color: #555; }
        .price-value { font-weight: bold; color: #2D5F4C; }
        .offered-price { color: #FF5722; font-size: 18px; }
        .button-container { text-align: center; margin: 24px 0; }
        .button { display: inline-block; padding: 16px 32px; margin: 8px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; min-width: 200px; }
        .btn-accept { background: linear-gradient(135deg, #2D5F4C 0%, #4CAF50 100%); color: white; }
        .btn-request { background: linear-gradient(135deg, #FF9800 0%, #FFB74D 100%); color: white; }
        .btn-deny { background: linear-gradient(135deg, #F44336 0%, #EF5350 100%); color: white; }
        .rider-message { background: #F5F5F5; padding: 16px; border-radius: 8px; margin: 20px 0; font-style: italic; color: #555; }
        .footer { text-align: center; margin-top: 24px; padding-top: 20px; border-top: 2px solid #E0E0E0; color: #888; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚗 New Ride Request</h1>
        </div>
        
        <p style="font-size: 16px; color: #333;">Hi Driver,</p>
        <p style="font-size: 16px; color: #333;">You have a new ride request! The rider has already paid.</p>
        
        <div class="info-box">
            <strong>Rider:</strong> John Doe (@johndoe)<br>
            <strong>Seats requested:</strong> 2
        </div>
        
        <div class="price-comparison">
            <h3 style="margin-top: 0; color: #E65100;">⚠️ Price Offer Used</h3>
            <div class="price-row">
                <span class="price-label">Your asking price:</span>
                <span class="price-value">$45.00 per seat</span>
            </div>
            <div class="price-row">
                <span class="price-label">Rider offered:</span>
                <span class="price-value offered-price">$35.00 per seat</span>
            </div>
            <div class="price-row" style="margin-top: 12px; padding-top: 12px; border-top: 2px dashed #FFB74D;">
                <span class="price-label">Your payout if accepted:</span>
                <span class="price-value">$70.00</span>
            </div>
        </div>
        
        <p style="text-align: center; font-size: 16px; color: #333; margin: 24px 0;"><strong>What would you like to do?</strong></p>
        
        <div class="button-container">
            <a href="https://www.cruisekauai.org/inbox?action=accept_offer&booking_id=booking_123" class="button btn-accept">✓ Accept Offer</a>
            <a href="https://www.cruisekauai.org/inbox?action=request_full_fare&booking_id=booking_123" class="button btn-request">$ Request Full Fare</a>
            <a href="https://www.cruisekauai.org/inbox?action=deny_request&booking_id=booking_123" class="button btn-deny">✕ Deny Request</a>
        </div>
        
        <div class="rider-message">
            <strong>Rider's message:</strong><br>
            "Hi! I'm a local student traveling to work. Would love to share the ride!"
        </div>
        
        <p style="font-size: 16px; color: #333; text-align: center;">Please log into Cruise Hawaiʻi to manage this request.</p>
        
        <div class="footer">
            Mahalo,<br>
            <strong>Cruise Hawaiʻi Team</strong>
        </div>
    </div>
</body>
</html>
            `.trim()
        });

        return Response.json({ success: true, message: 'Test email sent to willowvolkert@gmail.com' });
    } catch (error) {
        console.error('Error sending test email:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});