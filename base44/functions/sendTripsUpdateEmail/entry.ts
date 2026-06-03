import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const preview = !!payload.send_preview;
    const blast = !!payload.send_all;

    const subject = "New look + price offer feature on Cruise Kauaʻi";
    const logoHtml = '<div style="text-align:center;margin-bottom:24px;"><img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Kauai" style="width:68px;height:68px;border-radius:50%;object-fit:cover;border:3px solid #2f7d52;" /><p style="margin:6px 0 0;font-weight:bold;color:#2f7d52;font-size:14px;">Cruise Kauaʻi</p></div>';

    const html = (name, unsub) => '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:28px 12px;"><tr><td align="center">' +
      '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">' +
      '<tr><td align="center" style="padding:28px 24px 16px;border-bottom:1px solid #f0ebe0;">' + logoHtml + '</td></tr>' +
      '<tr><td style="padding:32px 28px;">' +
      '<p style="font-size:16px;color:#333;margin:0 0 14px;">Aloha ' + name + '! 🌺</p>' +
      '<p style="font-size:14px;line-height:1.8;color:#444;margin:0 0 20px;">This is Willow, founder of Cruise Kauaʻi. We have been listening to your feedback and today we are rolling out two big improvements to make getting around Kauaʻi <strong>easier and more accessible than ever.</strong></p>' +

      '<div style="background:#f0fdf4;border-left:4px solid #2f7d52;border-radius:8px;padding:18px;margin-bottom:18px;">' +
      '<p style="font-weight:700;font-size:15px;color:#1a1a1a;margin:0 0 10px;">🗺️ New look for the Trips page</p>' +
      '<p style="font-size:13px;line-height:1.7;color:#555;margin:0 0 12px;">The Trips page has a fresh, cleaner layout. When you open it, you now choose from three clear options:</p>' +
      '<div style="background:#fff;border-radius:8px;padding:9px 12px;margin-bottom:6px;border:1px solid #d1fae5;font-size:13px;color:#333;">🔍 <strong>Get a ride</strong> — browse by this week, a date, or route</div>' +
      '<div style="background:#fff;border-radius:8px;padding:9px 12px;margin-bottom:6px;border:1px solid #d1fae5;font-size:13px;color:#333;">🚗 <strong>Post a ride</strong> — offer seats on a trip you are already making</div>' +
      '<div style="background:#fff;border-radius:8px;padding:9px 12px;border:1px solid #d1fae5;font-size:13px;color:#333;">🙋 <strong>Request a ride</strong> — let drivers know you need one</div>' +
      '</div>' +

      '<div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:18px;margin-bottom:18px;">' +
      '<p style="font-weight:700;font-size:15px;color:#1a1a1a;margin:0 0 10px;">💸 New: Price offer feature</p>' +
      '<p style="font-size:13px;line-height:1.7;color:#555;margin:0 0 14px;">We believe transportation should be accessible to everyone on Kauaʻi. Now riders and drivers can find a price that works for both — making our platform more community-oriented than ever.</p>' +
      '<div style="background:#fffbf5;border-radius:8px;padding:12px;margin-bottom:8px;border:1px solid #fed7aa;">' +
      '<p style="font-weight:700;font-size:13px;color:#c2410c;margin:0 0 6px;">For Riders:</p>' +
      '<p style="font-size:12px;color:#555;margin:0 0 3px;">1. When booking, you can enter a <strong>lower price offer</strong> instead of the listed fare.</p>' +
      '<p style="font-size:12px;color:#555;margin:0 0 3px;">2. The driver can <strong>accept your offer</strong> or <strong>request the full price</strong>.</p>' +
      '<p style="font-size:12px;color:#555;margin:0;">3. If they request full fare, you will see it in your <strong>Inbox</strong> — accept or decline, no pressure.</p>' +
      '</div>' +
      '<div style="background:#fffbf5;border-radius:8px;padding:12px;border:1px solid #fed7aa;">' +
      '<p style="font-weight:700;font-size:13px;color:#c2410c;margin:0 0 6px;">For Drivers:</p>' +
      '<p style="font-size:12px;color:#555;margin:0 0 3px;">1. When a rider submits an offer, you see it on their booking request in your <strong>Inbox</strong>.</p>' +
      '<p style="font-size:12px;color:#555;margin:0 0 3px;">2. <strong>Accept their offer</strong> and they pay the bid price, or <strong>request full fare</strong>.</p>' +
      '<p style="font-size:12px;color:#555;margin:0;">3. The rider is notified and decides — you are always in control.</p>' +
      '</div>' +
      '<p style="font-size:12px;color:#92400e;font-weight:600;margin:12px 0 0;">Drivers set the price. Riders can ask for grace. Everyone decides what feels right — that is community.</p>' +
      '</div>' +

      '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td align="center">' +
      '<a href="https://cruisekauai.org/trips" style="display:inline-block;background:#2f7d52;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:50px;">explore the new trips page</a>' +
      '</td></tr></table>' +

      '<p style="font-size:13px;line-height:1.7;color:#555;margin:0 0 16px;">Every ride shared reduces traffic, keeps money in our local economy, and makes Kauaʻi a better place. Mahalo for being part of it. 🙏</p>' +
      '<p style="margin:0 0 3px;color:#444;font-size:13px;">Me ke aloha,</p>' +
      '<p style="margin:0;font-weight:bold;font-size:13px;">Willow</p>' +
      '<p style="margin:0;font-size:12px;color:#888;">Founder & CEO, Cruise Kauaʻi</p>' +
      '</td></tr>' +
      '<tr><td style="background:#faf7f2;border-top:1px solid #ede5d4;padding:16px 28px;text-align:center;">' +
      '<p style="font-size:12px;color:#aaa;margin:0 0 4px;">The Cruise Kauaʻi Team &middot; <a href="https://cruisekauai.org" style="color:#2f7d52;">cruisekauai.org</a></p>' +
      '<p style="font-size:11px;color:#bbb;margin:0;"><a href="' + unsub + '" style="color:#bbb;">unsubscribe</a></p>' +
      '</td></tr>' +
      '</table></td></tr></table></body></html>';

    if (preview) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'willowvolkert@gmail.com',
        from_name: "Cruise Kaua'i",
        subject: '[PREVIEW] ' + subject,
        body: html('Willow', 'https://cruisekauai.org/Unsubscribe?user_id=preview'),
      });
      return Response.json({ ok: true, mode: 'preview', to: 'willowvolkert@gmail.com' });
    }

    if (blast) {
      const allUsers = await base44.asServiceRole.entities.User.list();
      const eligible = allUsers.filter(u => u.email && u.email_update_frequency !== 'never');
      let sent = 0, errors = 0;
      for (const u of eligible) {
        try {
          const firstName = u.full_name ? u.full_name.split(' ')[0] : 'there';
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: u.email,
            from_name: "Cruise Kaua'i",
            subject,
            body: html(firstName, 'https://cruisekauai.org/Unsubscribe?user_id=' + u.id),
          });
          sent++;
        } catch (e) {
          errors++;
        }
      }
      return Response.json({ ok: true, mode: 'blast', sent, errors });
    }

    return Response.json({ error: 'Pass send_preview:true or send_all:true' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});