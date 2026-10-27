// Scheduled: turns off SMS for users inactive 14+ days, emails them, and leaves a
// reactivation card on their Account page (sms_disabled_inactivity = true).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const allUsers = await base44.asServiceRole.entities.User.list();
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000; // 14 days ago

    const appUrl = 'https://cruisekauai.org';

    const logo = `<div style="text-align:center;margin-bottom:28px;">
      <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Hawaiʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #2f7d52;" />
      <p style="margin:8px 0 0 0;font-weight:bold;color:#2f7d52;font-size:15px;letter-spacing:1px;">Cruise Hawaiʻi</p>
    </div>`;

    const footer = `
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:40px 0 24px;" />
      <p style="font-size:13px;color:#6b7280;line-height:1.6;">Need help? <a href="${appUrl}/contactus?explore=true" style="color:#2f7d52;font-weight:bold;">Contact us here</a></p>
    `;

    const subject = 'We paused your Cruise Hawaiʻi text alerts';

    const buildBody = (firstName) => `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px 16px;">
      ${logo}
      <p style="font-size:18px;margin-bottom:20px;">Aloha ${firstName} 🤙</p>
      <p style="margin-bottom:16px;">This is Willow, founder of Cruise Hawaiʻi. We noticed you haven't been active on the app in a little while, so we've <strong>paused your SMS text alerts</strong> to avoid sending you messages you might not want.</p>
      <p style="margin-bottom:24px;">No worries — your account is still here and ready whenever you are. You just won't receive text notifications about new rides, requests, or messages until you turn them back on.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr><td align="center">
          <a href="${appUrl}/account" style="display:inline-block;background:#2f7d52;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 40px;border-radius:50px;">Turn Text Alerts Back On →</a>
        </td></tr>
      </table>
      <p style="margin-bottom:16px;">Open your account page in the app and tap the button to re-enable texts. You can always opt back out by replying STOP to any message.</p>
      <p style="margin-bottom:8px;">Mahalo for being part of this 🙏</p>
      <p style="margin:0 0 4px;">With aloha,</p>
      <p style="margin:0;font-weight:bold;">Willow</p>
      <p style="margin:0;font-size:13px;color:#888;">Founder &amp; CEO, Cruise Hawaiʻi</p>
      ${footer}
    </body></html>`;

    let deactivated = 0;
    let emailed = 0;
    const errors = [];

    for (const user of allUsers) {
      // Only touch currently-opted-in users (skip admins and already-deactivated)
      if (!user.sms_notifications_enabled || user.sms_disabled_inactivity) continue;
      if (user.role === 'admin') continue;

      // Determine last activity: last_activity_date → updated_date → created_date
      let lastActivity = null;
      if (user.last_activity_date) lastActivity = new Date(user.last_activity_date);
      else if (user.updated_date) lastActivity = new Date(user.updated_date);
      else if (user.created_date) lastActivity = new Date(user.created_date);

      if (!lastActivity || lastActivity.getTime() < cutoff) {
        // Deactivate SMS
        try {
          await base44.asServiceRole.entities.User.update(user.id, {
            sms_notifications_enabled: false,
            sms_disabled_inactivity: true
          });
          deactivated++;
        } catch (e) {
          errors.push({ user: user.email || user.id, error: e.message, step: 'update' });
          continue;
        }

        // Send the notification email
        if (user.email) {
          try {
            const firstName = (user.full_name || '').split(' ')[0] || 'there';
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: user.email,
              from_name: "Cruise Hawaiʻi",
              subject,
              body: buildBody(firstName)
            });
            emailed++;
          } catch (e) {
            errors.push({ user: user.email || user.id, error: e.message, step: 'email' });
          }
        }
      }
    }

    return Response.json({ ok: true, deactivated, emailed, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});