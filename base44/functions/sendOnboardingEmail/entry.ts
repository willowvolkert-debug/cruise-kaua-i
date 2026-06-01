import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Sends a one-time onboarding email to a new user based on how far they got in setup.
// Type: "basic" | "license" | "vehicle"

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Guard: only send once per user
    if (user.onboarding_email_sent) {
      return Response.json({ skipped: true, reason: 'already sent' });
    }

    const { type } = await req.json().catch(() => ({}));
    // type is optional — we re-derive it from user data to be safe
    const hasLicense = !!(user.drivers_license_pending_review || user.drivers_license_verified);
    const hasVehicle = !!(user.vehicle_pending_review || user.vehicle_verified);

    const emailType = hasVehicle ? 'vehicle' : hasLicense ? 'license' : 'basic';

    const firstName = user.full_name?.split(' ')[0] || 'there';
    const appUrl = 'https://cruisekauai.org';
    const unsubscribeUrl = `${appUrl}/Unsubscribe?user_id=${user.id}`;

    const logo = `<div style="text-align:center;margin-bottom:28px;">
      <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Kauaʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #2f7d52;" />
      <p style="margin:8px 0 0 0;font-weight:bold;color:#2f7d52;font-size:15px;letter-spacing:1px;">Cruise Kauaʻi</p>
    </div>`;

    const footer = `
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:40px 0 24px;" />
      <p style="font-size:13px;color:#6b7280;line-height:1.6;">Need help? <a href="${appUrl}/ContactUs" style="color:#2f7d52;">Contact us here</a> or email willowvolkert@gmail.com.</p>
      <p style="font-size:12px;color:#9ca3af;margin-top:8px;">To stop receiving emails like this, <a href="${unsubscribeUrl}" style="color:#6b7280;">unsubscribe here</a>.</p>
    `;

    let subject, body;

    if (emailType === 'vehicle') {
      // User submitted vehicle info — they're going all-in as a driver
      subject = '🚗 You\'re almost a driver on Cruise Kauaʻi!';
      body = `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px;">
        ${logo}
        <p style="font-size:18px;margin-bottom:20px;">Aloha ${firstName}! 🌺</p>
        <p style="margin-bottom:16px;">This is Willow, founder & CEO of Cruise Kauaʻi. <strong>Mahalo for submitting your vehicle details</strong> — you're so close to becoming a driver on our platform!</p>
        <p style="margin-bottom:24px;">Here's what happens next:</p>

        <div style="background:#f0fdf4;border-left:4px solid #2f7d52;border-radius:8px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:bold;margin:0 0 10px;color:#1a1a1a;">✅ What you've done</p>
          <ul style="margin:0;padding-left:20px;color:#555;line-height:2.2;">
            <li>Created your profile</li>
            <li>Submitted your driver's license for review</li>
            <li>Submitted your vehicle info & photos</li>
            <li>Signed the driver agreement</li>
          </ul>
        </div>

        <div style="background:#fefce8;border-left:4px solid #ca8a04;border-radius:8px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:bold;margin:0 0 10px;color:#1a1a1a;">⏳ What happens next</p>
          <p style="margin:0 0 10px;color:#555;">Our team will review your license and vehicle info, typically within 24 hours. Once approved:</p>
          <ul style="margin:0;padding-left:20px;color:#555;line-height:2.2;">
            <li>You'll get an email confirmation</li>
            <li>You can immediately start <strong>posting rides</strong> and earning money</li>
            <li>Connect your bank account on your Account page to receive payouts</li>
          </ul>
        </div>

        <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:8px;padding:20px;margin-bottom:24px;">
          <p style="font-weight:bold;margin:0 0 10px;color:#1a1a1a;">💡 While you wait</p>
          <ul style="margin:0;padding-left:20px;color:#555;line-height:2.2;">
            <li><a href="${appUrl}/Account" style="color:#3b82f6;">Connect your bank account</a> (Stripe) for payouts</li>
            <li><a href="${appUrl}/Trips" style="color:#3b82f6;">Browse the trips board</a> to see what routes are active</li>
            <li>Think about your regular commute — that's your first ride to post!</li>
          </ul>
        </div>

        <p style="margin-top:32px;margin-bottom:8px;">Mahalo for helping reduce traffic on our beautiful island 🙏</p>
        <p style="margin:0;">Founder & CEO,</p>
        <p style="margin:0;font-weight:bold;">Willow</p>
        ${footer}
      </body></html>`;

    } else if (emailType === 'license') {
      // User submitted license but not vehicle — likely a rider
      subject = '🪪 Your Cruise Kauaʻi account is almost ready!';
      body = `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px;">
        ${logo}
        <p style="font-size:18px;margin-bottom:20px;">Aloha ${firstName}! 🌺</p>
        <p style="margin-bottom:16px;">This is Willow, founder & CEO of Cruise Kauaʻi. <strong>Mahalo for submitting your license</strong> — you're almost ready to start booking rides!</p>

        <div style="background:#f0fdf4;border-left:4px solid #2f7d52;border-radius:8px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:bold;margin:0 0 10px;color:#1a1a1a;">✅ What you've done</p>
          <ul style="margin:0;padding-left:20px;color:#555;line-height:2.2;">
            <li>Created your profile</li>
            <li>Submitted your driver's license for identity verification</li>
          </ul>
        </div>

        <div style="background:#fefce8;border-left:4px solid #ca8a04;border-radius:8px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:bold;margin:0 0 10px;color:#1a1a1a;">⏳ What happens next</p>
          <p style="margin:0;color:#555;">Our team will review your license within 24 hours. Once verified, you'll be able to <strong>browse and book rides</strong> immediately.</p>
        </div>

        <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:8px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:bold;margin:0 0 10px;color:#1a1a1a;">🚗 Want to earn money driving?</p>
          <p style="margin:0 0 10px;color:#555;">You can also become a driver and earn money on trips you're already making. Whenever you're ready:</p>
          <ol style="margin:0;padding-left:20px;color:#555;line-height:2.2;">
            <li>Go to your <a href="${appUrl}/Account" style="color:#3b82f6;">Account page</a></li>
            <li>Click "Finish profile" to add your vehicle details</li>
            <li>Once approved, you can post rides and earn money</li>
          </ol>
        </div>

        <p style="margin-top:32px;margin-bottom:8px;">Mahalo for being part of our community 🙏</p>
        <p style="margin:0;">Founder & CEO,</p>
        <p style="margin:0;font-weight:bold;">Willow</p>
        ${footer}
      </body></html>`;

    } else {
      // Basic signup — didn't add much info yet
      subject = '🌺 Welcome to Cruise Kauaʻi — finish setting up your account';
      body = `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px;">
        ${logo}
        <p style="font-size:18px;margin-bottom:20px;">Aloha ${firstName}! 🌺</p>
        <p style="margin-bottom:16px;">This is Willow, founder & CEO of Cruise Kauaʻi. <strong>Mahalo for signing up!</strong> Cruise Kauaʻi is a community-based carpooling platform to reduce traffic, save money, and connect people across our island.</p>
        <p style="margin-bottom:24px;">To start booking or posting rides, you'll need to finish your account setup. It only takes a few minutes:</p>

        <div style="background:#faf7f2;border-left:4px solid #e8742a;border-radius:8px;padding:20px;margin-bottom:16px;">
          <p style="font-weight:bold;margin:0 0 10px;color:#1a1a1a;">👤 Step 1: Complete Your Profile</p>
          <p style="margin:0 0 8px;color:#555;">Add your username, age, gender, bio, and a profile photo so drivers and riders know who they're sharing a ride with.</p>
          <p style="margin:0;font-size:13px;color:#888;">→ <a href="${appUrl}/Account" style="color:#e8742a;">Go to your account to fill this out</a></p>
        </div>

        <div style="background:#faf7f2;border-left:4px solid #3b82f6;border-radius:8px;padding:20px;margin-bottom:16px;">
          <p style="font-weight:bold;margin:0 0 10px;color:#1a1a1a;">🪪 Step 2: Verify Your Driver's License</p>
          <p style="margin:0 0 8px;color:#555;">Required to book or post rides. Upload both sides of your license — our team reviews within 24 hours.</p>
          <p style="margin:0;font-size:13px;color:#888;">→ <a href="${appUrl}/Account" style="color:#3b82f6;">Tap "Verify Now" under Verification</a></p>
        </div>

        <div style="background:#faf7f2;border-left:4px solid #8b5cf6;border-radius:8px;padding:20px;margin-bottom:24px;">
          <p style="font-weight:bold;margin:0 0 10px;color:#1a1a1a;">🚗 Optional: Become a Driver & Earn Money</p>
          <p style="margin:0 0 8px;color:#555;">Once verified, you can also add your vehicle, sign the driver agreement, and start posting rides to earn money on your daily commute.</p>
          <p style="margin:0;font-size:13px;color:#888;">→ <a href="${appUrl}/VehicleDetails" style="color:#8b5cf6;">Add vehicle details here</a></p>
        </div>

        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;color:#166534;font-size:14px;">🎥 Not sure how to use the app? <a href="${appUrl}/Welcome?tutorial=true" style="color:#2f7d52;font-weight:bold;">Watch our 2-minute welcome tutorial →</a></p>
        </div>

        <p style="margin-top:32px;margin-bottom:8px;">Mahalo for joining cruise kauaʻi and helping our island home 🙏</p>
        <p style="margin:0;">Founder & CEO,</p>
        <p style="margin:0;font-weight:bold;">Willow</p>
        ${footer}
      </body></html>`;
    }

    // Send the email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      from_name: "Cruise Kaua'i",
      subject,
      body,
    });

    // Mark as sent so it never fires again
    await base44.asServiceRole.entities.User.update(user.id, {
      onboarding_email_sent: true,
    });

    return Response.json({ ok: true, emailType });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});