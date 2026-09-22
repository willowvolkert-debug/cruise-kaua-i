import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const SUBJECT = "Community Update: After Lowell";
const AU = "https://cruisekauai.org";

const buildBody = (name, unsubUrl) => `<html><body style="font-family:Arial,sans-serif;background:#f5f0e8;margin:0;padding:32px 16px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
  <div style="text-align:center;padding:28px;border-bottom:1px solid #f0ebe0;">
    <img src="${AU}/logo.jpg" style="width:64px;height:64px;border-radius:50%;border:3px solid #2f7d52;"/>
    <p style="font-weight:700;margin:8px 0 0;">Cruise Kauaʻi</p>
  </div>
  <div style="padding:32px;">
    <p>Aloha ${name},</p>
    <p>Hurricane Lowell affected our community more than expected, and Kauaʻi will be in a recovery period through the beginning of October. Right now, we're focused on helping our neighbors, partners and fellow businesses, and directing resources where they're needed most.</p>
    <p>Across the island, we're seeing supplies getting where they're needed. Cruise does not need donations. Instead, we'll continue sharing vetted families who still need support rebuilding their homes and farms. You can also find direct ways to support families across Kauaʻi through Storm Kōkua.</p>
    <p>We love you, Kauaʻi. 🌺</p>
    <p>As a team, we're taking this time to reflect on how the hurricane has changed our idea of the status quo, where we are headed, and what community really looks like.</p>
    <p>That includes looking at Cruise and the role transportation can play in both blue skies and grey skies. We'll be integrating disaster relief into our upcoming app launch to help connect resources with those who need them.</p>
    <p>For now, let's all be patient, be kind and share aloha.</p>
    <p style="margin-top:32px;">Cruise Hawaiʻi</p>
  </div>
  <div style="background:#faf7f2;border-top:1px solid #ede5d4;padding:16px;text-align:center;font-size:0.75rem;color:#aaa;">
    <a href="${unsubUrl}" style="color:#bbb;">unsubscribe</a>
  </div>
</div>
</body></html>`;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

    const { preview, blast } = await req.json().catch(() => ({}));

    if (preview) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'willowvolkert@gmail.com',
        from_name: "Cruise Kauaʻi",
        subject: '[PREVIEW] ' + SUBJECT,
        body: buildBody('Willow', AU + '/Unsubscribe?user_id=preview')
      });
      return Response.json({ ok: true, mode: 'preview' });
    }

    if (blast) {
      const users = await base44.asServiceRole.entities.User.list();
      const eligible = users.filter(u => u.email && u.email_update_frequency !== 'never');
      let sent = 0, errors = 0;
      for (const u of eligible) {
        try {
          const fn = u.full_name ? u.full_name.split(' ')[0] : 'there';
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: u.email,
            from_name: "Cruise Kauaʻi",
            subject: SUBJECT,
            body: buildBody(fn, AU + '/Unsubscribe?user_id=' + u.id)
          });
          sent++;
        } catch (e) { errors++; }
      }
      return Response.json({ ok: true, sent, errors, total_eligible: eligible.length });
    }

    return Response.json({ error: 'Pass preview:true or blast:true' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}