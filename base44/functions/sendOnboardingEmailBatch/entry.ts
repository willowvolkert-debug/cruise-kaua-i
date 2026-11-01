import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Sends onboarding emails to ALL users who haven't received one yet
// Called by scheduled automation at 7am HST
// 5 email types: basic, license_submitted, license_verified, driver_submitted, driver_verified

const buildEmails = (firstName, appUrl, unsubscribeUrl, logo, footer) => ({

  basic: {
    subject: 'Welcome to Cruise Hawaiʻi- why this service is worth your time',
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
        <li>🤝 <strong>Builds community</strong> — Connections made in a car last longer than you'd think.</li>
        <li>🏡 <strong>Supports locals</strong> — affordable rides help working families who can't afford a second car</li>
      </ul>

      <p style="margin-bottom:24px;">You signed up. That's the first step. <strong>Finishing your profile takes about 3 minutes</strong> — and it's what unlocks everything.</p>

      <div style="background:#faf7f2;border-left:4px solid #e8742a;border-radius:8px;padding:20px;margin-bottom:14px;">
        <p style="font-weight:bold;margin:0 0 8px;color:#1a1a1a;">👤 Step 1: Complete your profile</p>
        <p style="margin:0 0 8px;color:#555;">Add a photo, bio, and basic info. This is how drivers and riders get to know you before sharing a car.</p>
        <p style="margin:0;font-size:13px;">→ <a href="${appUrl}/Account" style="color:#e8742a;font-weight:bold;">Go to your Account page</a></p>
      </div>

      <div style="background:#faf7f2;border-left:4px solid #3b82f6;border-radius:8px;padding:20px;margin-bottom:14px;">
        <p style="font-weight:bold;margin:0 0 8px;color:#1a1a1a;">🪪 Step 2: Verify your ID</p>
        <p style="margin:0 0 8px;color:#555;">Upload both sides of your driver's license — required to book or post rides. Our team reviews within 24 hours.</p>
      </div>

      <div style="background:#faf7f2;border-left:4px solid #8b5cf6;border-radius:8px;padding:20px;margin-bottom:28px;">
        <p style="font-weight:bold;margin:0 0 8px;color:#1a1a1a;">🚗 Step 3 (optional): Become a driver</p>
        <p style="margin:0 0 8px;color:#555;">Already commuting? Add your vehicle and start posting rides. Drivers earn on trips they're already making.</p>
        <p style="margin:0;font-size:13px;">→ <a href="${appUrl}/Account" style="color:#8b5cf6;font-weight:bold;">Add your vehicle on your Account page</a></p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr><td align="center">
          <a href="${appUrl}/Account" style="display:inline-block;background:#2f7d52;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 40px;border-radius:50px;">Finish My Account →</a>
        </td></tr>
      </table>

      <p style="margin-bottom:24px;font-size:14px;color:#6b7280;text-align:center;">Have feedback, or experiencing issues? Reply to this email to let us know!</p>

      <p style="margin-bottom:8px;">This island is small. What we do here — together — makes a real difference. I'm glad you're here.</p>
      <p style="margin:0 0 4px;">Me ke aloha,</p>
      <p style="margin:0;font-weight:bold;">Willow</p>
      <p style="margin:0;font-size:13px;color:#888;">Founder & CEO, Cruise Hawaiʻi</p>
      ${footer}
    </body></html>`,
  },

  license_submitted: {
    subject: 'Welcome to Cruise Hawaiʻi- here\'s what\'s next',
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
        <li>💳 <strong>Request a ride & pay securely in-app</strong> — no cash needed.</li>
        <li>💬 <strong>Once the driver approves your ride</strong>, you will be put into a chat in your inbox. Message the driver directly to coordinate pickup details.</li>
        <li>⭐ <strong>Rate your driver</strong> after — it helps the whole community.</li>
      </ul>

      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #86efac;">
        <p style="font-weight:bold;margin:0 0 8px;color:#166534;">🚗 Also consider becoming a driver</p>
        <p style="margin:0 0 10px;color:#333;">If you have a car and make regular trips — even just to the grocery store or work — you could be earning money on Cruise Hawaiʻi. Drivers set their own prices and only take rides they want.</p>
        <p style="margin:0;font-size:13px;">→ <a href="${appUrl}/Account" style="color:#2f7d52;font-weight:bold;">Add your vehicle on your Account page</a> whenever you're ready</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr><td align="center">
          <a href="${appUrl}/Trips" style="display:inline-block;background:#2f7d52;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 40px;border-radius:50px;">Browse Available Rides →</a>
        </td></tr>
      </table>

      <p style="margin-bottom:24px;font-size:14px;color:#6b7280;text-align:center;">Have feedback, or experiencing issues? Reply to this email to let us know!</p>

      <p style="margin-bottom:8px;">Mahalo for being part of this — every shared ride helps our community 🙏</p>
      <p style="margin:0 0 4px;">With aloha,</p>
      <p style="margin:0;font-weight:bold;">Willow</p>
      <p style="margin:0;font-size:13px;color:#888;">Founder & CEO, Cruise Hawaiʻi</p>
      ${footer}
    </body></html>`,
  },

  license_verified: {
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
          <a href="${appUrl}/Trips" style="display:inline-block;background:#2f7d52;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 40px;border-radius:50px;">Browse Available Rides →</a>
        </td></tr>
      </table>

      <div style="background:#faf7f2;border-left:4px solid #8b5cf6;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="font-weight:bold;margin:0 0 8px;color:#1a1a1a;">🚗 Thinking about driving?</p>
        <p style="margin:0 0 8px;color:#555;">If you have a car and make regular trips, you can earn money by posting rides. Drivers set their own prices and only take rides they want.</p>
        <p style="margin:0;font-size:13px;">→ <a href="${appUrl}/Account" style="color:#8b5cf6;font-weight:bold;">Add your vehicle on your Account page</a></p>
      </div>

      <p style="margin-bottom:24px;font-size:14px;color:#6b7280;text-align:center;">Have feedback, or experiencing issues? Reply to this email to let us know!</p>

      <p style="margin-bottom:8px;">Mahalo for being part of this — every shared ride helps our community 🙏</p>
      <p style="margin:0 0 4px;">With aloha,</p>
      <p style="margin:0;font-weight:bold;">Willow</p>
      <p style="margin:0;font-size:13px;color:#888;">Founder & CEO, Cruise Hawaiʻi</p>
      ${footer}
    </body></html>`,
  },

  driver_submitted: {
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
          <li><a href="${appUrl}/Account" style="color:#3b82f6;">Connect your bank account</a> (Stripe) for payouts</li>
          <li><a href="${appUrl}/Trips" style="color:#3b82f6;">Browse the trips board</a> to see what routes are active</li>
          <li>Think about your regular commute — that's your first ride to post!</li>
        </ul>
      </div>

      <p style="margin-bottom:24px;font-size:14px;color:#6b7280;text-align:center;">Have feedback, or experiencing issues? Reply to this email to let us know!</p>

      <p style="margin-top:32px;margin-bottom:8px;">Mahalo for helping reduce traffic on our beautiful island 🙏</p>
      <p style="margin:0 0 4px;">With aloha,</p>
      <p style="margin:0;font-weight:bold;">Willow</p>
      <p style="margin:0;font-size:13px;color:#888;">Founder & CEO, Cruise Hawaiʻi</p>
      ${footer}
    </body></html>`,
  },

  driver_verified: {
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
          <a href="${appUrl}/Trips" style="display:inline-block;background:#2f7d52;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 40px;border-radius:50px;">Post Your First Ride →</a>
        </td></tr>
      </table>

      <div style="background:#fefce8;border-left:4px solid #ca8a04;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="font-weight:bold;margin:0 0 8px;color:#1a1a1a;">💳 Don't forget to connect your bank account</p>
        <p style="margin:0 0 8px;color:#555;">To receive payouts from completed rides, you need to connect your bank account via Stripe on your Account page.</p>
        <p style="margin:0;font-size:13px;">→ <a href="${appUrl}/Account" style="color:#ca8a04;font-weight:bold;">Connect your bank account now</a></p>
      </div>

      <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="font-weight:bold;margin:0 0 8px;color:#1a1a1a;">💰 New: Price bidding feature</p>
        <p style="margin:0 0 8px;color:#555;">Riders can now make lower price offers for your rides. You have full control — <strong>accept their bid, or request they pay your full price</strong>. It's up to you to decide what works best.</p>
      </div>

      <p style="margin-bottom:24px;font-size:14px;color:#6b7280;text-align:center;">Have feedback, or experiencing issues? Reply to this email to let us know!</p>

      <p style="margin-top:32px;margin-bottom:8px;">Mahalo for helping reduce traffic on our beautiful island 🙏</p>
      <p style="margin:0 0 4px;">With aloha,</p>
      <p style="margin:0;font-weight:bold;">Willow</p>
      <p style="margin:0;font-size:13px;color:#888;">Founder & CEO, Cruise Hawaiʻi</p>
      ${footer}
    </body></html>`,
  },
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Only admins can trigger this batch email
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const { send_previews, send_trips_update, send_trips_blast } = payload; // v2

    const appUrl = 'https://cruisehi.org';
    const logo = `<div style="text-align:center;margin-bottom:28px;">
      <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Hawaiʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #2f7d52;" />
      <p style="margin:8px 0 0 0;font-weight:bold;color:#2f7d52;font-size:15px;letter-spacing:1px;">Cruise Hawaiʻi</p>
    </div>`;

    if (send_trips_update || send_trips_blast) {
      const tripsSubject = "New look + price offer feature on Cruise Hawaiʻi";
      const buildTripsBody = (firstName, unsubUrl) => `<html><body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 16px;"><tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td align="center" style="padding:32px 24px 20px;border-bottom:1px solid #f0ebe0;">${logo}</td></tr>
        <tr><td style="padding:36px;">
        <p style="font-size:1.05rem;color:#333;margin:0 0 18px;">Aloha ${firstName}! 🌺</p>
        <p style="font-size:0.95rem;line-height:1.8;color:#444;margin:0 0 22px;">This is Willow, founder of Cruise Hawaiʻi. We have been listening to your feedback and today we are rolling out two big improvements to make getting around Kauaʻi <strong>easier and more accessible than ever.</strong></p>
        <div style="background:#f0fdf4;border-left:4px solid #2f7d52;border-radius:8px;padding:20px;margin-bottom:22px;">
        <p style="font-weight:700;font-size:1rem;color:#1a1a1a;margin:0 0 10px;">New look for the Trips page</p>
        <p style="font-size:0.92rem;line-height:1.7;color:#555;margin:0 0 14px;">The Trips page has a fresh cleaner layout. You now choose from three clear options:</p>
        <div style="background:#fff;border-radius:8px;padding:10px 14px;margin-bottom:8px;border:1px solid #d1fae5;font-size:0.9rem;color:#333;"><strong>Get a ride</strong> — browse by this week, a date, or route</div>
        <div style="background:#fff;border-radius:8px;padding:10px 14px;margin-bottom:8px;border:1px solid #d1fae5;font-size:0.9rem;color:#333;"><strong>Post a ride</strong> — offer seats on a trip you are already making</div>
        <div style="background:#fff;border-radius:8px;padding:10px 14px;border:1px solid #d1fae5;font-size:0.9rem;color:#333;"><strong>Request a ride</strong> — let drivers know you need one</div>
        </div>
        <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:20px;margin-bottom:22px;">
        <p style="font-weight:700;font-size:1rem;color:#1a1a1a;margin:0 0 10px;">New: Price offer feature</p>
        <p style="font-size:0.92rem;line-height:1.7;color:#555;margin:0 0 14px;">Transportation should be accessible to everyone. Now riders and drivers can find a price that works for both.</p>
        <div style="background:#fffbf5;border-radius:8px;padding:14px;margin-bottom:10px;border:1px solid #fed7aa;">
        <p style="font-weight:700;font-size:0.9rem;color:#c2410c;margin:0 0 6px;">For Riders:</p>
        <p style="font-size:0.88rem;color:#555;margin:0 0 4px;">1. When booking, enter a <strong>lower price offer</strong> instead of the listed fare.</p>
        <p style="font-size:0.88rem;color:#555;margin:0 0 4px;">2. The driver can <strong>accept your offer</strong> or <strong>request the full price</strong>.</p>
        <p style="font-size:0.88rem;color:#555;margin:0;">3. If they request full fare, you see it in your <strong>Inbox</strong> — accept or decline.</p>
        </div>
        <div style="background:#fffbf5;border-radius:8px;padding:14px;border:1px solid #fed7aa;">
        <p style="font-weight:700;font-size:0.9rem;color:#c2410c;margin:0 0 6px;">For Drivers:</p>
        <p style="font-size:0.88rem;color:#555;margin:0 0 4px;">1. Rider offers appear in your <strong>Inbox</strong> on the booking request.</p>
        <p style="font-size:0.88rem;color:#555;margin:0 0 4px;">2. <strong>Accept their offer</strong> or <strong>request full fare</strong> — your choice.</p>
        <p style="font-size:0.88rem;color:#555;margin:0;">3. The rider decides — you are always in control.</p>
        </div>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center">
        <a href="https://cruisehi.org/trips" style="display:inline-block;background:#2f7d52;color:#fff;text-decoration:none;font-weight:700;font-size:1rem;padding:15px 40px;border-radius:50px;">explore the new trips page</a>
        </td></tr></table>
        <p style="font-size:0.92rem;line-height:1.7;color:#555;margin:0 0 20px;">Every ride shared reduces traffic, keeps money in our local economy, and makes Kauaʻi a better place. Mahalo. 🙏</p>
        <p style="margin:0 0 4px;color:#444;">Me ke aloha,</p>
        <p style="margin:0;font-weight:bold;">Willow</p>
        <p style="margin:0;font-size:0.82rem;color:#888;">Founder & CEO, Cruise Hawaiʻi</p>
        </td></tr>
        <tr><td style="background:#faf7f2;border-top:1px solid #ede5d4;padding:20px 32px;text-align:center;">
        <p style="font-size:0.78rem;color:#aaa;margin:0 0 6px;">The Cruise Hawaiʻi Team &middot; <a href="https://cruisehi.org" style="color:#2f7d52;">cruisehi.org</a></p>
        <p style="font-size:0.75rem;color:#bbb;margin:0;"><a href="${unsubUrl}" style="color:#bbb;">unsubscribe</a></p>
        </td></tr></table></td></tr></table></body></html>`;

      if (send_trips_update) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: 'willowvolkert@gmail.com',
          from_name: "Cruise Hawaiʻi",
          subject: '[PREVIEW] ' + tripsSubject,
          body: buildTripsBody('Willow', 'https://cruisehi.org/Unsubscribe?user_id=preview'),
        });
        return Response.json({ ok: true, mode: 'trips_preview', to: 'willowvolkert@gmail.com' });
      }

      if (send_trips_blast) {
        const allU = await base44.asServiceRole.entities.User.list();
        const eligible = allU.filter(u => u.email && u.email_update_frequency !== 'never');
        let sc = 0, ec = 0;
        for (const u of eligible) {
          try {
            const fn = u.username || (u.full_name ? u.full_name.split(' ')[0] : 'there');
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: u.email,
              from_name: "Cruise Hawaiʻi",
              subject: tripsSubject,
              body: buildTripsBody(fn, 'https://cruisehi.org/Unsubscribe?user_id=' + u.id),
            });
            sc++;
          } catch (err) {
            console.error('trips_blast error ' + u.email + ': ' + err.message);
            ec++;
          }
        }
        return Response.json({ ok: true, mode: 'trips_blast', sent: sc, errors: ec });
      }
    }
    const footer = `
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:40px 0 24px;" />
      <p style="font-size:13px;color:#6b7280;line-height:1.6;">Need help? <a href="${appUrl}/contactus?explore=true" style="color:#2f7d52;font-weight:bold;">Contact us here</a></p>
      <p style="font-size:12px;color:#9ca3af;margin-top:8px;"><a href="${appUrl}/Unsubscribe?user_id={{user_id}}" style="color:#6b7280;">Unsubscribe here</a>.</p>
    `;

    // Send preview emails to willowvolkert@gmail.com if requested
    if (send_previews) {
      const firstName = 'Willow';
      const unsubscribeUrl = `${appUrl}/Unsubscribe?user_id=preview`;
      const previewEmails = buildEmails(firstName, appUrl, unsubscribeUrl, logo, footer);
      
      const previewTypes = ['license_verified', 'driver_verified'];
      const results = [];
      
      for (const type of previewTypes) {
        const { subject, body } = previewEmails[type];
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: 'willowvolkert@gmail.com',
          from_name: "Cruise Hawaiʻi",
          subject: `[PREVIEW ${type.toUpperCase()}] ${subject}`,
          body,
        });
        results.push(type);
      }
      
      return Response.json({ ok: true, mode: 'preview_batch', types: results, to: 'willowvolkert@gmail.com' });
    }

    const emails = buildEmails('{{first_name}}', appUrl, '{{unsubscribe_url}}', logo, footer);

    // Get all users who haven't received onboarding email yet
    const allUsers = await base44.asServiceRole.entities.User.list();
    const usersToSend = allUsers.filter(u => !u.onboarding_email_sent && u.email && u.email_update_frequency !== 'never');

    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const u of usersToSend) {
      try {
        const hasLicenseVerified = !!u.drivers_license_verified;
        const hasLicensePending = !!(u.drivers_license_pending_review && !u.drivers_license_verified);
        const hasVehicleVerified = !!u.vehicle_verified;
        const hasVehiclePending = !!(u.vehicle_pending_review && !u.vehicle_verified);
        
        // Determine email type based on verification status
        let emailType = 'basic';
        if (hasVehicleVerified) {
          emailType = 'driver_verified';
        } else if (hasVehiclePending) {
          emailType = 'driver_submitted';
        } else if (hasLicenseVerified) {
          emailType = 'license_verified';
        } else if (hasLicensePending) {
          emailType = 'license_submitted';
        }
        
        const firstName = u.username || u.full_name?.split(' ')[0] || 'there';
        const unsubscribeUrl = `${appUrl}/Unsubscribe?user_id=${u.id}`;
        const userEmails = buildEmails(firstName, appUrl, unsubscribeUrl, logo, footer);
        const { subject, body } = userEmails[emailType];

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          from_name: "Cruise Hawaiʻi",
          subject,
          body,
        });

        // Mark as sent
        await base44.asServiceRole.entities.User.update(u.id, { onboarding_email_sent: true });
        sentCount++;
      } catch (err) {
        console.error(`Error sending to ${u.email}:`, err.message);
        errorCount++;
      }
    }

    return Response.json({ 
      ok: true, 
      sent: sentCount, 
      skipped: skippedCount, 
      errors: errorCount 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});