import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Called from the frontend on first login to send the basic welcome email immediately.
// Uses the authenticated user's session — no payload needed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.email) {
      return Response.json({ skipped: true, reason: 'no email' });
    }

    // Skip if already sent
    if (user.onboarding_email_sent) {
      return Response.json({ skipped: true, reason: 'already sent' });
    }

    const appUrl = 'https://cruisekauai.org';
    const firstName = user.username || user.full_name?.split(' ')[0] || 'there';
    const unsubscribeUrl = `${appUrl}/unsubscribe?user_id=${user.id}`;

    const logo = `<div style="text-align:center;margin-bottom:28px;">
      <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Hawaiʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #2f7d52;" />
      <p style="margin:8px 0 0 0;font-weight:bold;color:#2f7d52;font-size:15px;letter-spacing:1px;">Cruise Hawaiʻi</p>
    </div>`;

    const footer = `
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:40px 0 24px;" />
      <p style="font-size:13px;color:#6b7280;line-height:1.6;">Need help? <a href="${appUrl}/contactus?explore=true" style="color:#2f7d52;font-weight:bold;">Contact us here</a></p>
      <p style="font-size:12px;color:#9ca3af;margin-top:8px;">To stop receiving emails like this, <a href="${unsubscribeUrl}" style="color:#6b7280;">unsubscribe here</a>.</p>
    `;

    const subject = 'Welcome to Cruise Hawaiʻi- why this service is worth your time';
    const body = `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px 16px;">
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

      <p style="margin-bottom:24px;font-size:14px;color:#6b7280;text-align:center;">Have feedback, or experiencing issues? Reply to this email to let us know!</p>

      <p style="margin-bottom:8px;">This island is small. What we do here — together — makes a real difference. I'm glad you're here.</p>
      <p style="margin:0 0 4px;">Me ke aloha,</p>
      <p style="margin:0;font-weight:bold;">Willow</p>
      <p style="margin:0;font-size:13px;color:#888;">Founder & CEO, Cruise Hawaiʻi</p>
      ${footer}
    </body></html>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      from_name: "Cruise Hawaiʻi",
      subject,
      body,
    });

    await base44.asServiceRole.entities.User.update(user.id, { onboarding_email_sent: true });

    return Response.json({ ok: true, to: user.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});