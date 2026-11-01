import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { getNewsletterRecipients } from '../../shared/newsletterRecipients.ts';

const S = "New look + price offer feature on Cruise Hawaiʻi";
const AU = "https://cruisekauai.org";

const b = (n, u) => `<html><body style="font-family:Arial,sans-serif;background:#f5f0e8;margin:0;padding:32px 16px;"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;"><div style="text-align:center;padding:28px;border-bottom:1px solid #f0ebe0;"><img src="${AU}/logo.jpg" style="width:64px;height:64px;border-radius:50%;border:3px solid #2f7d52;"/><p style="font-weight:700;margin:8px 0 0;">Cruise Hawaiʻi</p></div><div style="padding:32px;"><p>Aloha ${n}! 🌺</p><p>Two big updates from Willow at Cruise Hawaiʻi:</p><p><strong>1. New Trips page layout</strong> — now choose Get a Ride, Post a Ride, or Request a Ride.</p><p><strong>2. Price offer feature</strong> — riders can offer a lower price, drivers accept or counter. Community-driven pricing.</p><div style="text-align:center;margin:24px 0;"><a href="${AU}/trips" style="background:#2f7d52;color:#fff;text-decoration:none;font-weight:700;padding:14px 36px;border-radius:50px;display:inline-block;">explore the new trips page</a></div><p>Mahalo 🙏 — Willow, Founder of Cruise Hawaiʻi</p></div><div style="background:#faf7f2;border-top:1px solid #ede5d4;padding:16px;text-align:center;font-size:0.75rem;color:#aaa;"><a href="${u}" style="color:#bbb;">unsubscribe</a></div></div></body></html>`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });
    const { preview, blast } = await req.json().catch(() => ({}));
    if (preview) {
      await base44.asServiceRole.integrations.Core.SendEmail({ to: 'willowvolkert@gmail.com', from_name: "Cruise Hawaiʻi", subject: '[PREVIEW] ' + S, body: b('Willow', AU + '/Unsubscribe?user_id=preview') });
      return Response.json({ ok: true, mode: 'preview' });
    }
    if (blast) {
      const eligible = await getNewsletterRecipients(base44);
      let sent = 0, errors = 0;
      for (const u of eligible) {
        try {
          const fn = u.username || (u.full_name ? u.full_name.split(' ')[0] : 'there');
          await base44.asServiceRole.integrations.Core.SendEmail({ to: u.email, from_name: "Cruise Hawaiʻi", subject: S, body: b(fn, AU + '/Unsubscribe?user_id=' + u.id) });
          sent++;
        } catch (e) { errors++; }
      }
      return Response.json({ ok: true, sent, errors });
    }
    return Response.json({ error: 'Pass preview:true or blast:true' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});