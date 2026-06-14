// Email blast: Remind drivers/riders without phone numbers to add them for SMS notifications
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const S = "Turn on text alerts for rides on Cruise Kauaʻi 📲";
const AU = "https://cruisekauai.org";

const emailBody = (name, userId) => `<html><body style="font-family:Arial,sans-serif;background:#f5f0e8;margin:0;padding:32px 16px;"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;"><div style="text-align:center;padding:28px;border-bottom:1px solid #f0ebe0;"><img src="${AU}/logo.jpg" style="width:64px;height:64px;border-radius:50%;border:3px solid #2f7d52;"/><p style="font-weight:700;margin:8px 0 0;">Cruise Kauaʻi</p></div><div style="padding:32px;"><p>Aloha ${name}! 🌺</p><p>We wanted to make sure you know — <strong>ride notifications are now sent by text message</strong> when a new ride or ride request is posted on the island.</p><p>We noticed your account doesn't have a phone number yet, so you might be missing out on last-minute rides and new requests.</p><div style="text-align:center;margin:24px 0;"><a href="${AU}/account" style="background:#2f7d52;color:#fff;text-decoration:none;font-weight:700;padding:14px 36px;border-radius:50px;display:inline-block;">add your phone number</a></div><p style="color:#666;font-size:0.9rem;">While you're there, take a moment to finish setting up your profile — it helps other riders and drivers know who you are.</p><p>Mahalo 🙏 — Willow, Founder of Cruise Kauaʻi</p></div><div style="background:#faf7f2;border-top:1px solid #ede5d4;padding:16px;text-align:center;font-size:0.75rem;color:#aaa;"><a href="${AU}/Unsubscribe?user_id=${userId}" style="color:#bbb;">unsubscribe</a></div></div></body></html>`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

    const { preview, blast } = await req.json().catch(() => ({}));

    if (preview) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        from_name: "Cruise Kauaʻi",
        subject: '[PREVIEW] ' + S,
        body: emailBody(user.full_name?.split(' ')[0] || 'there', 'preview'),
      });
      return Response.json({ ok: true, mode: 'preview' });
    }

    if (blast) {
      const users = await base44.asServiceRole.entities.User.list();
      const eligible = users.filter(u => {
        const hasPhone = u.phone_number && u.phone_number.trim().length > 0;
        const isDriverOrRider = u.user_type === 'driver' || u.user_type === 'rider' || u.user_type === 'both';
        return isDriverOrRider && !hasPhone && u.email;
      });

      let sent = 0, errors = 0;
      for (const u of eligible) {
        try {
          const name = u.full_name ? u.full_name.split(' ')[0] : 'there';
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: u.email,
            from_name: "Cruise Kauaʻi",
            subject: S,
            body: emailBody(name, u.id),
          });
          sent++;
        } catch (e) { errors++; }
      }
      return Response.json({ ok: true, total_eligible: eligible.length, sent, errors });
    }

    return Response.json({ error: 'Pass preview:true or blast:true' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});