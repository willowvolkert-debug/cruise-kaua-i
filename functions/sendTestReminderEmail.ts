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
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <p>Aloha!</p>

    <p>You started making your carpooling account, but you're not finished!</p>

    <p><strong>1. BECOME A RIDER</strong></p>
    <p>In order to be a rider, input your profile details such as name, age, and bio. Then, securely verify your license and identity using Stripe. Finally, sign our legal agreements such as Terms of Service and our Community Agreement. Now you are able to get rides around the island!</p>

    <p><strong>2. BECOME A DRIVER</strong></p>
    <p>If you would like to be a driver and make money, upload your vehicle information, insurance information, and sign our Driver Agreement. Once this is uploaded, you will be a verified driver- making money, building community, and reducing traffic at the same time!</p>

    <p>Questions? Just reply to this email and we'll be happy to help!</p>

    <p>Mahalo for joining Cruise Kauaʻi,<br>
    The Cruise Kauaʻi Team</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <p style="font-size: 12px; color: #666;">If you'd like to stop receiving these setup reminders, <a href="https://cruisekauai.base44.app/unsubscribe?user_id=test123">click here</a>.</p>

    <p style="font-size: 12px; color: #666; margin-top: 10px;">Replies to this email are not monitored. Please fill out the contact us form on the Cruise Kauaʻi website, or email willowvolkert@gmail.com, with any questions or concerns.</p>
    </body>
    </html>
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