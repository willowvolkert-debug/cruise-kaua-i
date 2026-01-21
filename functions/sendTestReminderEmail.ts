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
    <body style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <p style="font-size: 18px; margin-bottom: 24px;">🌺 Aloha!</p>

    <p style="margin-bottom: 20px;">You started making your carpooling account, but you're not finished!</p>

    <div style="margin: 32px 0;">
      <p style="font-size: 16px; font-weight: bold; margin-bottom: 16px;">🚗 1. BECOME A RIDER</p>
      <p style="margin-bottom: 16px; padding-left: 20px;">
        In order to be a rider, input your profile details such as name, age, and bio. Then, securely verify your license and identity using Stripe. Finally, sign our legal agreements such as Terms of Service and our Community Agreement. 
      </p>
      <p style="padding-left: 20px;">Now you are able to get rides around the island! 🏝️</p>
    </div>

    <div style="margin: 32px 0;">
      <p style="font-size: 16px; font-weight: bold; margin-bottom: 16px;">💰 2. BECOME A DRIVER</p>
      <p style="margin-bottom: 16px; padding-left: 20px;">
        If you would like to be a driver and make money, upload your vehicle information, insurance information, and sign our Driver Agreement. 
      </p>
      <p style="padding-left: 20px;">Once this is uploaded, you will be a verified driver— making money, building community, and reducing traffic at the same time! ✨</p>
    </div>

    <p style="margin-top: 40px; margin-bottom: 8px;">Mahalo for joining cruise kauaʻi and helping our island home 🙏</p>
    <p style="margin: 0;">Founder & CEO,</p>
    <p style="margin: 0; font-weight: bold;">Willow</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0;">

    <p style="font-size: 12px; color: #666; margin-bottom: 12px;">If you'd like to stop receiving these setup reminders, <a href="https://cruisekauai.base44.app/unsubscribe?user_id=test123" style="color: #0066cc;">click here</a>.</p>

    <p style="font-size: 12px; color: #666;">Replies to this email are not monitored. Please fill out the contact us form on the Cruise Kauaʻi website, or email willowvolkert@gmail.com, with any questions or concerns.</p>
    </body>
    </html>
    `.trim();

    await base44.integrations.Core.SendEmail({
      to: email,
      subject: '🌺 Finish setting up your Cruise Kauaʻi Carpooling Account Today!',
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