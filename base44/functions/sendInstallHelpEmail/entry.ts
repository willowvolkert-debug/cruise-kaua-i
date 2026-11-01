import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Must be authenticated — users can only send this to themselves
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const { email, name } = payload;

    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    // Non-admins can only send to their own email
    if (me.role !== 'admin' && email.toLowerCase() !== me.email.toLowerCase()) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const firstName = name?.split(' ')[0] || 'there';
    const appUrl = 'https://cruisehi.org';

    const logo = `<div style="text-align:center;margin-bottom:28px;">
      <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Hawaiʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #2f7d52;" />
      <p style="margin:8px 0 0 0;font-weight:bold;color:#2f7d52;font-size:15px;letter-spacing:1px;">Cruise Hawaiʻi</p>
    </div>`;

    const body = `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px 16px;">
      ${logo}
      <p style="font-size:18px;margin-bottom:16px;">Aloha ${firstName}! 🌺</p>
      <p style="margin-bottom:16px;">No worries at all — adding a website to your home screen is a little different depending on your phone. Here's a step-by-step guide just for you!</p>

      <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:8px;padding:20px;margin-bottom:20px;">
        <p style="font-weight:bold;margin:0 0 12px;color:#1e40af;font-size:16px;">iPhone / iPad (Safari)</p>
        <ol style="margin:0;padding-left:20px;color:#1e3a5f;line-height:2.4;">
          <li>Open <strong>Safari</strong> browser (must be Safari, not Chrome)</li>
          <li>Go to <a href="${appUrl}" style="color:#3b82f6;">${appUrl}</a></li>
          <li>Tap the <strong>Share button</strong> — it looks like a box with an arrow pointing up, at the bottom center of your screen</li>
          <li>If you don't see it right away, try scrolling the bottom toolbar slightly</li>
          <li>Scroll down the share menu and tap <strong>"Add to Home Screen"</strong></li>
          <li>Tap <strong>"Add"</strong> in the top right corner</li>
          <li>Done! Look for the Cruise Hawaiʻi icon on your home screen</li>
        </ol>
        <p style="margin:12px 0 0;font-size:13px;color:#6b7280;font-style:italic;">Note: If you see "..." (three dots) at the top right of the share menu, tap that — "Add to Home Screen" may be hidden there.</p>
      </div>

      <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:8px;padding:20px;margin-bottom:20px;">
        <p style="font-weight:bold;margin:0 0 12px;color:#166534;font-size:16px;">Android (Chrome)</p>
        <ol style="margin:0;padding-left:20px;color:#14532d;line-height:2.4;">
          <li>Open <strong>Chrome</strong> browser</li>
          <li>Go to <a href="${appUrl}" style="color:#22c55e;">${appUrl}</a></li>
          <li>Tap the <strong>menu</strong> (three dots) in the top right corner of your browser</li>
          <li>Tap <strong>"Add to Home screen"</strong></li>
          <li>Tap <strong>"Add"</strong></li>
          <li>Done! The app will appear on your home screen</li>
        </ol>
      </div>

      <p style="margin-bottom:20px;">Still stuck? No problem — just email us at <a href="mailto:cruisekauai@gmail.com" style="color:#2f7d52;font-weight:bold;">cruisekauai@gmail.com</a> and we'll walk you through it personally. We're a small, local team and we actually read these 🤙</p>

      <p style="margin-bottom:8px;">With aloha,</p>
      <p style="margin:0;font-weight:bold;">Willow</p>
      <p style="margin:0;font-size:13px;color:#888;">Founder & CEO, Cruise Hawaiʻi</p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:40px 0 24px;" />
      <p style="font-size:13px;color:#6b7280;">Need more help? <a href="${appUrl}/contactus" style="color:#2f7d52;font-weight:bold;">Contact us here</a></p>
    </body></html>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      from_name: "Cruise Hawaiʻi",
      subject: "How to add Cruise Hawaiʻi to your home screen",
      body,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});