import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { preview, blast } = await req.json().catch(() => ({}));
    const sub = "New look + price offer feature on Cruise Kauaʻi";
    const mkBody = (n, u) => '<html><body style="font-family:Arial,sans-serif;background:#f5f0e8;margin:0;padding:32px 16px;">'
      + '<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">'
      + '<div style="text-align:center;padding:28px 24px 20px;border-bottom:1px solid #f0ebe0;">'
      + '<img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid #2f7d52;" />'
      + '<p style="font-weight:700;margin:8px 0 0;color:#1a1a1a;">Cruise Kauaʻi</p></div>'
      + '<div style="padding:32px;">'
      + '<p style="font-size:1rem;color:#333;margin:0 0 16px;">Aloha ' + n + '! 🌺</p>'
      + '<p style="font-size:0.93rem;line-height:1.8;color:#444;margin:0 0 20px;">This is Willow, founder of Cruise Kauaʻi. We have been listening to your feedback and today we are rolling out two big improvements.</p>'
      + '<div style="background:#f0fdf4;border-left:4px solid #2f7d52;border-radius:8px;padding:18px;margin-bottom:18px;">'
      + '<p style="font-weight:700;color:#1a1a1a;margin:0 0 10px;">New look for the Trips page</p>'
      + '<p style="font-size:0.9rem;color:#555;margin:0 0 12px;">The Trips page now has three clear options:</p>'
      + '<div style="background:#fff;border-radius:6px;padding:9px 12px;margin-bottom:6px;border:1px solid #d1fae5;font-size:0.88rem;color:#333;"><strong>Get a ride</strong> — browse by week, date, or route</div>'
      + '<div style="background:#fff;border-radius:6px;padding:9px 12px;margin-bottom:6px;border:1px solid #d1fae5;font-size:0.88rem;color:#333;"><strong>Post a ride</strong> — offer seats on trips you are already making</div>'
      + '<div style="background:#fff;border-radius:6px;padding:9px 12px;border:1px solid #d1fae5;font-size:0.88rem;color:#333;"><strong>Request a ride</strong> — let drivers know you need one</div>'
      + '</div>'
      + '<div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:18px;margin-bottom:18px;">'
      + '<p style="font-weight:700;color:#1a1a1a;margin:0 0 10px;">New: Price offer feature</p>'
      + '<p style="font-size:0.9rem;color:#555;margin:0 0 12px;">Riders can now offer a lower price. Drivers can accept or request full fare. Everyone decides what works. That is community.</p>'
      + '<div style="background:#fffbf5;border-radius:6px;padding:12px;margin-bottom:8px;border:1px solid #fed7aa;font-size:0.87rem;color:#555;">'
      + '<strong style="color:#c2410c;">For Riders:</strong> Enter a price offer when booking. Driver accepts or counters. You decide in your Inbox.</div>'
      + '<div style="background:#fffbf5;border-radius:6px;padding:12px;border:1px solid #fed7aa;font-size:0.87rem;color:#555;">'
      + '<strong style="color:#c2410c;">For Drivers:</strong> See offers in your Inbox. Accept the bid or request full fare. Your choice, always.</div>'
      + '</div>'
      + '<div style="text-align:center;margin-bottom:24px;">'
      + '<a href="https://cruisekauai.org/trips" style="display:inline-block;background:#2f7d52;color:#fff;text-decoration:none;font-weight:700;font-size:0.95rem;padding:14px 36px;border-radius:50px;">explore the new trips page</a>'
      + '</div>'
      + '<p style="font-size:0.9rem;color:#555;margin:0 0 16px;">Every ride shared reduces traffic and keeps money in our community. Mahalo. 🙏</p>'
      + '<p style="color:#444;margin:0 0 2px;">Me ke aloha,</p>'
      + '<p style="margin:0;font-weight:bold;">Willow</p>'
      + '<p style="margin:0;font-size:0.8rem;color:#888;">Founder & CEO, Cruise Kauaʻi</p>'
      + '</div>'
      + '<div style="background:#faf7f2;border-top:1px solid #ede5d4;padding:16px 24px;text-align:center;">'
      + '<p style="font-size:0.75rem;color:#aaa;margin:0 0 4px;">Cruise Kauaʻi &middot; <a href="https://cruisekauai.org" style="color:#2f7d52;">cruisekauai.org</a></p>'
      + '<p style="font-size:0.72rem;color:#bbb;margin:0;"><a href="' + u + '" style="color:#bbb;">unsubscribe</a></p>'
      + '</div></div></body></html>';

    if (preview) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'willowvolkert@gmail.com',
        from_name: "Cruise Kaua'i",
        subject: '[PREVIEW] ' + sub,
        body: mkBody('Willow', 'https://cruisekauai.org/Unsubscribe?user_id=preview'),
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
            from_name: "Cruise Kaua'i",
            subject: sub,
            body: mkBody(fn, 'https://cruisekauai.org/Unsubscribe?user_id=' + u.id),
          });
          sent++;
        } catch (e) {
          console.error('err ' + u.email + ': ' + e.message);
          errors++;
        }
      }
      return Response.json({ ok: true, mode: 'blast', sent, errors });
    }

    return Response.json({ error: 'Pass preview:true or blast:true' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});