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

You started making your carpooling account, but you're not finished!

STEP 1: In order to be a rider, input your profile details such as name, age, and bio. Then, securely verify your license and identity using Stripe. Finally, sign our legal agreements such as Terms of Service and our Community Agreement. Now you are able to get rides around the island!


STEP 2: If you would like to be a driver and make money, upload your vehicle information, insurance information, and sign our Driver Agreement. Once this is uploaded, you will be a verified driver- making money, building community, and reducing traffic at the same time!


Questions? Just reply to this email and we'll be happy to help!

Mahalo for joining Cruise Kauaʻi,
The Cruise Kauaʻi Team

---

If you'd like to stop receiving these setup reminders, click here:
https://cruisekauai.base44.app/unsubscribe?user_id=test123
    `.trim();

    await base44.integrations.Core.SendEmail({
      to: email,
      subject: 'Finish setting up your Cruise Kauaʻi Carpooling Account Today!',
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