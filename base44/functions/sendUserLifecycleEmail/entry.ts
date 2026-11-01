import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Handles all user lifecycle emails. Called directly from the frontend at each trigger point.
// emailType: "basic" | "license_submitted" | "license_verified" | "vehicle_submitted" | "vehicle_verified"
// Pass { emailType, userId } in the payload. Admin-calling functions pass userId; 
// user-calling functions use the authenticated user's own ID.

const appUrl = 'https://cruisekauai.org';

const logo = `<div style="text-align:center;margin-bottom:28px;">
  <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Hawaiʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #2f7d52;" />
  <p style="margin:8px 0 0 0;font-weight:bold;color:#2f7d52;font-size:15px;letter-spacing:1px;">Cruise Hawaiʻi</p>
</div>`;

const buildFooter = (unsubUrl) => `
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:40px 0 24px;" />
  <p style="font-size:13px;color:#6b7280;line-height:1.6;">Need help? <a href="${appUrl}/contactus?explore=true" style="color:#2f7d52;font-weight:bold;">Contact us here</a></p>
  <p style="font-size:12px;color:#9ca3af;margin-top:8px;">To stop receiving emails like this, <a href="${unsubUrl}" style="color:#6b7280;">unsubscribe here</a>.</p>
`;

const emails = {

  basic: (firstName, unsubUrl) => ({
    subject: 'Welcome to Cruise Hawaiʻi — why this service is worth your time',
    body: `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px 16px;">
      ${logo}
      <p style="font-size:18px;margin-bottom:20px;">Aloha ${firstName} 🤙</p>
      <p style="margin-bottom:16px;">This is Willow, founder of Cruise Hawaiʻi. I wanted to reach out personally, because I think you joining this platform genuinely means something. We're building something worth being part of, and I'm glad you're here.</p>
      <p style="margin-bottom:16px;">Kauaʻi is one of the most beautiful places on Earth — and it's under pressure. Traffic on the highway is getting worse every year. The cost of living keeps climbing. Locals are leaving. Tourists are frustrated. And yet, every single day, thousands of us are driving the same roads, alone in our cars, going the same direction.</p>
      <div style="background:#f0fdf4;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #86efac;">
        <p style="font-weight:bold;font-size:16px;margin:0 0 12px;color:#166534;">Cruise Hawaiʻi is one real, tangible way to change that — right now.</p>
        <p style="margin:0 0 10px;color:#333;">Not someday when the infrastructure improves. Not when the government changes. <em>Right now</em>, with the people already on this island, sharing the rides we're already making.</p>
      </div>
      <p style="margin-bottom:12px;font-weight:bold;color:#1a1a1a;">Here's what your participation does:</p>
      <ul style="padding-left:20px;color:#444;margin-bottom:24px;line-height:2.4;">
        <li>🚦 <strong>Reduces traffic</strong> — every shared ride is one fewer car on the road</li>
        <li>💸 <strong>Keeps money local</strong> — ride payments go directly to your neighbors, not corporations</li>
        <li>🌿 <strong>Cuts emissions</strong> — fewer cars = cleaner air for our ʻāina</li>
        <li>🤝 <strong>Builds community</strong> — connections made in a car last longer than you'd think</li>
        <li>🏡 <strong>Supports locals</strong> — affordable rides help working families who can't afford a second car</li>
      </ul>
      <p style="margin-bottom:24px;">You signed up. That's the first step. <strong>Finishing your profile takes about 3 minutes</strong> — and it's what unlocks everything.</p>
      <div style="background:#faf7f2;border-left:4px solid #e8742a;border-radius:8px;padding:20px;margin-bottom:14px;">
        <p style="font-weight:bold;margin:0 0 8px;color:#1a1a1a;">👤 Step 1: Complete your profile</p>
        <p style="margin:0 0 8px;color:#555;">Add a photo, bio, and basic info. This is how drivers and riders get to know you before sharing a car.</p>
        <p style="margin:0;font-size:13px;">→ <a href="${appUrl}/account" style="color:#e8742a;font-weight:bold;">Go to your Account page</a></p>
      </div>
      <div style="background:#faf7f2;border-left:4px solid #3b82f6;border-radius:8px;padding:20px;margin-bottom:14px;">
        <p style="font-weight:bold;margin:0 0 8px;color:#1a1a1a;">🪪 Step 2: Verify your ID</p>
        <p style="margin:0 0 8px;color:#555;">Upload both sides of your driver's license — required to book or post rides. Our team reviews within 24 hours.</p>
      </div>
      <div style="background:#faf7f2;border-left:4px solid #8b5cf6;border-radius:8px;padding:20px;margin-bottom:28px;">
        <p style="font-weight:bold;margin:0 0 8px;color:#1a1a1a;">🚗 Step 3 (optional): Become a driver</p>
        <p style="margin:0 0 8px;color:#555;">Already commuting? Add your vehicle and start posting rides. Drivers earn on trips they're already making.</p>
        <p style="margin:0;font-size:13px;">→ <a href="${appUrl}/account" style="color:#8b5cf6;font-weight:bold;">Add your vehicle on your Account page</a></p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr><td align="center">
          <a href="${appUrl}/account" style="display:inline-block;background:#2f7d52;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 40px;border-radius:50px;">Finish My Account →</a>
        </td></tr>
      </table>
      <p style="margin-bottom:8px;">This island is small. What we do here — together — makes a real difference. I'm glad you're here.</p>
      <p style="margin:0 0 4px;">Me ke aloha,</p>
      <p style="margin:0;font-weight:bold;">Willow</p>
      <p style="margin:0;font-size:13px;color:#888;">Founder & CEO, Cruise Hawaiʻi</p>
      ${buildFooter(unsubUrl)}
    </body></html>`,
  }),

  license_submitted: (firstName, unsubUrl) => ({
    subject: 'License received — here\'s what happens next on Cruise Hawaiʻi',
    body: `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px 16px;">
      ${logo}
      <p style="font-size:18px;margin-bottom:20px;">Aloha ${firstName}! 🌺</p>
      <p style="margin-bottom:16px;">This is Willow, founder of Cruise Hawaiʻi. <strong>Mahalo for submitting your license</strong> — that's the big one. You're almost ready to start booking rides.</p>
      <div style="background:#fefce8;border-left:4px solid #ca8a04;border-radius:8px;padding:20px;margin-bottom:20px;">
        <p style="font-weight:bold;margin:0 0 8px;color:#1a1a1a;">⏳ We're reviewing your license now</p>
        <p style="margin:0;color:#555;">Our team typically reviews within 24 hours. Once verified, you'll get an email and you'll be able to <strong>view & book rides immediately</strong>.</p>
      </div>
      <p style="margin-bottom:12px;font-weight:bold;color:#1a1a1a;">While you wait — here's how riding on Cruise Hawaiʻi works:</p>
      <ul style="padding-left:20px;color:#444;margin-bottom:24px;line-height:2.4;">
        <li>🔍 <strong>Browse rides</strong> on the Trips board — filter by date, route, and time</li>
        <li>💳 <strong>Request a ride & pay securely in-app</strong> — no cash needed</li>
        <li>💬 <strong>Once the driver approves your ride</strong>, you'll be put into a chat in your inbox to coordinate pickup</li>
        <li>⭐ <strong>Rate your driver</strong> after — it helps the whole community</li>
      </ul>
      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #86efac;">
        <p style="font-weight:bold;margin:0 0 8px;color:#166534;">🚗 Also consider becoming a driver</p>
        <p style="margin:0 0 10px;color:#333;">If you have a car and make regular trips — even just to the grocery store or work — you could be earning money on Cruise Hawaiʻi. Drivers set their own prices and only take rides they want.</p>
        <p style="margin:0;font-size:13px;">→ <a href="${appUrl}/account" style="color:#2f7d52;font-weight:bold;">Add your vehicle on your Account page</a> whenever you're ready</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr><td align="center">
          <a href="${appUrl}/trips" style="display:inline-block;background:#2f7d52;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 40px;border-radius:50px;">Browse Available Rides →</a>
        </td></tr>
      </table>
      <p style="margin-bottom:8px;">Mahalo for being part of this — every shared ride helps our community 🙏</p>
      <p style="margin:0 0 4px;">With aloha,</p>
      <p style="margin:0;font-weight:bold;">Willow</p>
      <p style="margin:0;font-size:13px;color:#888;">Founder & CEO, Cruise Hawaiʻi</p>
      ${buildFooter(unsubUrl)}
    </body></html>`,
  }),

  license_verified: (firstName, unsubUrl) => ({
    subject: 'You\'re verified! Start booking rides on Cruise Hawaiʻi',
    body: `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px 16px;">
      ${logo}
      <p style="font-size:18px;margin-bottom:20px;">Aloha ${firstName}! 🎉</p>
      <p style="margin-bottom:16px;">This is Willow, founder of Cruise Hawaiʻi. <strong>Mahalo — your driver's license has been verified!</strong> You now have full access to book rides on our platform.</p>
      <div style="background:#f0fdf4;border-left:4px solid #2f7d52;border-radius:8px;padding:20px;margin-bottom:20px;">
        <p style="font-weight:bold;margin:0 0 10px;color:#1a1a1a;">✅ You're all set to ride!</p>
        <ul style="margin:0;padding-left:20px;color:#555;line-height:2.2;">
          <li>Browse available rides on the Trips board</li>
          <li>Book seats with secure in-app payment</li>
          <li>Message drivers directly once confirmed</li>
          <li>Rate your experience after each ride</li>
        </ul>
      </div>
      <p style="margin-bottom:12px;font-weight:bold;color:#1a1a1a;">How to book your first ride:</p>
      <ul style="padding-left:20px;color:#444;margin-bottom:24px;line-height:2.4;">
        <li>🔍 <strong>Go to Trips → Find a Ride</strong> — browse by date and route</li>
        <li>💳 <strong>Tap a ride card → Book Ride</strong> — tell the driver why you need the ride</li>
        <li>⏳ <strong>Wait for confirmation</strong> — drivers typically respond within a few hours</li>
        <li>🗺️ <strong>Meet your driver</strong> — coordinate pickup details in your Inbox</li>
      </ul>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr><td align="center">
          <a href="${appUrl}/trips" style="display:inline-block;background:#2f7d52;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 40px;border-radius:50px;">Browse Available Rides →</a>
        </td></tr>
      </table>
      <div style="background:#faf7f2;border-left:4px solid #8b5cf6;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="font-weight:bold;margin:0 0 8px;color:#1a1a1a;">🚗 Thinking about driving?</p>
        <p style="margin:0 0 8px;color:#555;">If you have a car and make regular trips, you can earn money by posting rides. Drivers set their own prices and only take rides they want.</p>
        <p style="margin:0;font-size:13px;">→ <a href="${appUrl}/account" style="color:#8b5cf6;font-weight:bold;">Add your vehicle on your Account page</a></p>
      </div>
      <p style="margin-bottom:8px;">Mahalo for being part of this — every shared ride helps our community 🙏</p>
      <p style="margin:0 0 4px;">With aloha,</p>
      <p style="margin:0;font-weight:bold;">Willow</p>
      <p style="margin:0;font-size:13px;color:#888;">Founder & CEO, Cruise Hawaiʻi</p>
      ${buildFooter(unsubUrl)}
    </body></html>`,
  }),

  vehicle_submitted: (firstName, unsubUrl) => ({
    subject: 'You\'re almost a driver on Cruise Hawaiʻi',
    body: `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px 16px;">
      ${logo}
      <p style="font-size:18px;margin-bottom:20px;">Aloha ${firstName}! 🌺</p>
      <p style="margin-bottom:16px;">This is Willow, founder & CEO of Cruise Hawaiʻi. <strong>Mahalo for submitting your vehicle details</strong> — you're so close to becoming a driver on our platform!</p>
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
          <li><a href="${appUrl}/account" style="color:#3b82f6;">Connect your bank account</a> (Stripe) for payouts</li>
          <li><a href="${appUrl}/trips" style="color:#3b82f6;">Browse the trips board</a> to see what routes are active</li>
          <li>Think about your regular commute — that's your first ride to post!</li>
        </ul>
      </div>
      <p style="margin-top:32px;margin-bottom:8px;">Mahalo for helping reduce traffic on our beautiful island 🙏</p>
      <p style="margin:0 0 4px;">With aloha,</p>
      <p style="margin:0;font-weight:bold;">Willow</p>
      <p style="margin:0;font-size:13px;color:#888;">Founder & CEO, Cruise Hawaiʻi</p>
      ${buildFooter(unsubUrl)}
    </body></html>`,
  }),

  vehicle_verified: (firstName, unsubUrl) => ({
    subject: 'You\'re approved! Start earning as a driver on Cruise Hawaiʻi',
    body: `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px 16px;">
      ${logo}
      <p style="font-size:18px;margin-bottom:20px;">Aloha ${firstName}! 🎉</p>
      <p style="margin-bottom:16px;">This is Willow, founder & CEO of Cruise Hawaiʻi. <strong>Mahalo — your driver account is fully verified!</strong> You can now start posting rides and earning money on trips you're already making.</p>
      <div style="background:#f0fdf4;border-left:4px solid #2f7d52;border-radius:8px;padding:20px;margin-bottom:20px;">
        <p style="font-weight:bold;margin:0 0 10px;color:#1a1a1a;">✅ You're ready to drive!</p>
        <ul style="margin:0;padding-left:20px;color:#555;line-height:2.2;">
          <li>Post rides on your regular routes</li>
          <li>Set your own prices</li>
          <li>Accept or decline ride requests</li>
          <li>Receive payouts directly to your bank account</li>
        </ul>
      </div>
      <p style="margin-bottom:12px;font-weight:bold;color:#1a1a1a;">How to post your first ride:</p>
      <ul style="padding-left:20px;color:#444;margin-bottom:24px;line-height:2.4;">
        <li>🗺️ <strong>Go to Trips → Post a Ride</strong> — enter your route, date, time, and available seats</li>
        <li>💰 <strong>Set your price</strong> — suggest a fair cost-sharing amount per seat</li>
        <li>⏳ <strong>Wait for bookings</strong> — riders will request seats on your ride</li>
        <li>✅ <strong>Accept or decline</strong> — review rider profiles and confirm bookings</li>
        <li>💬 <strong>Coordinate pickup</strong> — message riders in your Inbox once confirmed</li>
      </ul>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr><td align="center">
          <a href="${appUrl}/trips" style="display:inline-block;background:#2f7d52;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 40px;border-radius:50px;">Post Your First Ride →</a>
        </td></tr>
      </table>
      <div style="background:#fefce8;border-left:4px solid #ca8a04;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="font-weight:bold;margin:0 0 8px;color:#1a1a1a;">💳 Don't forget to connect your bank account</p>
        <p style="margin:0 0 8px;color:#555;">To receive payouts from completed rides, you need to connect your bank account via Stripe on your Account page.</p>
        <p style="margin:0;font-size:13px;">→ <a href="${appUrl}/account" style="color:#ca8a04;font-weight:bold;">Connect your bank account now</a></p>
      </div>
      <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="font-weight:bold;margin:0 0 8px;color:#1a1a1a;">💰 Price bidding feature</p>
        <p style="margin:0 0 8px;color:#555;">Riders can make lower price offers for your rides. You have full control — <strong>accept their bid, or request they pay your full price</strong>. It's up to you.</p>
      </div>
      <p style="margin-top:32px;margin-bottom:8px;">Mahalo for helping reduce traffic on our beautiful island 🙏</p>
      <p style="margin:0 0 4px;">With aloha,</p>
      <p style="margin:0;font-weight:bold;">Willow</p>
      <p style="margin:0;font-size:13px;color:#888;">Founder & CEO, Cruise Hawaiʻi</p>
      ${buildFooter(unsubUrl)}
    </body></html>`,
  }),
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const { emailType, userId } = payload;

    if (!emailType) return Response.json({ error: 'emailType required' }, { status: 400 });

    // Determine target user: admin can specify a userId, otherwise use the calling user
    let targetUser = user;
    if (userId && userId !== user.id) {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const allUsers = await base44.asServiceRole.entities.User.list();
      targetUser = allUsers.find(u => u.id === userId);
      if (!targetUser) return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (!targetUser.email) return Response.json({ skipped: true, reason: 'no email' });

    // Dedup guard: check the sent-flag for this email type
    const sentFlagMap = {
      basic: 'onboarding_email_sent',
      license_submitted: 'license_submitted_email_sent',
      license_verified: 'license_verified_email_sent',
      vehicle_submitted: 'vehicle_submitted_email_sent',
      vehicle_verified: 'vehicle_verified_email_sent',
    };
    const sentFlag = sentFlagMap[emailType];
    if (sentFlag && targetUser[sentFlag]) {
      return Response.json({ skipped: true, reason: 'already sent' });
    }

    const firstName = targetUser.username || targetUser.full_name?.split(' ')[0] || 'there';
    const unsubUrl = `${appUrl}/Unsubscribe?user_id=${targetUser.id}`;

    const emailFn = emails[emailType];
    if (!emailFn) return Response.json({ error: 'Unknown emailType' }, { status: 400 });

    const { subject, body } = emailFn(firstName, unsubUrl);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: targetUser.email,
      from_name: "Cruise Hawaiʻi",
      subject,
      body,
    });

    // Mark as sent
    if (sentFlag) {
      await base44.asServiceRole.entities.User.update(targetUser.id, { [sentFlag]: true });
    }

    return Response.json({ ok: true, emailType, to: targetUser.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});