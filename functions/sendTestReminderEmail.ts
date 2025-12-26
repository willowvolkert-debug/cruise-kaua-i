import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await req.json();
    
    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Sample missing steps for demo
    const missingSteps = [
      '• Complete your profile (username, bio, age, gender)',
      '• Upload a profile picture',
      '• Verify your driver\'s license'
    ];

    const emailBody = `
Aloha!

We noticed you haven't finished setting up your Cruise Kauaʻi account yet. We're here to help you get started!

To start booking or posting rides, please complete these steps:

${missingSteps.join('\n')}

Getting started is easy:
1. Log in to your Cruise Kauaʻi account
2. Go to the Account page
3. Complete the missing steps above

Once you're all set up, you'll be able to:
✓ Book rides with verified drivers
✓ Post your own rides and earn money
✓ Connect with the Kauaʻi community

Questions? Just reply to this email and we'll be happy to help!

Mahalo for joining Cruise Kauaʻi,
The Cruise Kauaʻi Team

---
If you'd like to stop receiving these setup reminders, click here:
https://cruisekauai.base44.app/unsubscribe?user_id=test123
    `.trim();

    await base44.integrations.Core.SendEmail({
      to: email,
      subject: '🌺 Complete your Cruise Kauaʻi setup',
      body: emailBody
    });

    return Response.json({ 
      success: true,
      message: `Test reminder email sent to ${email}`
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});