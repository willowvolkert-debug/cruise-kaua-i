import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Sends an announcement to ALL users who have NOT submitted a license.
// Priority: SMS (if they have a phone number + SMS opted in), otherwise email.
// Modes:
//   preview — sends SMS + email to the admin themselves so they can review content
//   count   — returns how many users would receive SMS vs email (no messages sent)
//   blast   — sends to all eligible users in batches

const appUrl = 'https://cruisekauai.org';

const smsMessage = 'Great news from Cruise Kaua\u02bbi! You can now browse & request rides without a finished profile or license. Browse rides, request a seat, and simply finish your profile before you get in the car together. ' + appUrl + '/trips';

const buildEmailHtml = (name, unsubUrl) => '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">' +
  '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:28px 12px;"><tr><td align="center">' +
  '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">' +
  '<tr><td align="center" style="padding:28px 24px 16px;border-bottom:1px solid #f0ebe0;">' +
  '<div style="text-align:center;margin-bottom:8px;"><img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Kauai" style="width:68px;height:68px;border-radius:50%;object-fit:cover;border:3px solid #2f7d52;" /><p style="margin:6px 0 0;font-weight:bold;color:#2f7d52;font-size:14px;">Cruise Kaua\u02bbi</p></div>' +
  '</td></tr>' +
  '<tr><td style="padding:32px 28px;">' +
  '<p style="font-size:16px;color:#333;margin:0 0 14px;">Aloha ' + name + '! \uD83C\uDF3A</p>' +
  '<p style="font-size:14px;line-height:1.8;color:#444;margin:0 0 20px;">This is Willow, founder of Cruise Kaua\u02bbi. I have <strong>great news</strong> \u2014 we just made it much easier to start using Cruise Kaua\u02bbi.</p>' +
  '<div style="background:#f0fdf4;border-left:4px solid #2f7d52;border-radius:8px;padding:18px;margin-bottom:18px;">' +
  '<p style="font-weight:700;font-size:15px;color:#1a1a1a;margin:0 0 10px;">\u2705 You can now browse & request rides without a finished profile or license</p>' +
  '<p style="font-size:13px;line-height:1.7;color:#555;margin:0 0 10px;">Browse rides, request a seat, and simply finish your profile <strong>before you get in the car together</strong>. No more waiting for verification just to see what\u2019s available.</p>' +
  '</div>' +
  '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td align="center">' +
  '<a href="' + appUrl + '/trips" style="display:inline-block;background:#2f7d52;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:50px;">Browse Available Rides \u2192</a>' +
  '</td></tr></table>' +
  '<p style="font-size:13px;line-height:1.7;color:#555;margin:0 0 16px;">When you find a ride that works, just request a seat \u2014 you can finish your profile and upload your license before the ride happens. It\u2019s that simple.</p>' +
  '<p style="font-size:13px;line-height:1.7;color:#555;margin:0 0 16px;">Every ride shared keeps money in our local economy and makes Kaua\u02bbi a better place. Mahalo for being a part of the movement. \uD83D\uDE4F</p>' +
  '<p style="margin:0 0 3px;color:#444;font-size:13px;">Me ke aloha,</p>' +
  '<p style="margin:0;font-weight:bold;font-size:13px;">Willow</p>' +
  '<p style="margin:0;font-size:12px;color:#888;">Founder & CEO, Cruise Kaua\u02bbi</p>' +
  '</td></tr>' +
  '<tr><td style="background:#faf7f2;border-top:1px solid #ede5d4;padding:16px 28px;text-align:center;">' +
  '<p style="font-size:12px;color:#aaa;margin:0 0 4px;">Cruise Kaua\u02bbi &middot; <a href="' + appUrl + '" style="color:#2f7d52;">cruisekauai.org</a></p>' +
  '<p style="font-size:11px;color:#bbb;margin:0;"><a href="' + unsubUrl + '" style="color:#bbb;">unsubscribe</a></p>' +
  '</td></tr>' +
  '</table></td></tr></table></body></html>';

const emailSubject = 'Great news \u2014 you can now browse & request rides on Cruise Kaua\u02bbi';

// A user is "unverified" if they have NOT submitted a license at all
// (neither verified nor pending review, and no submitted date)
const isUnverified = (u) => {
  if (u.drivers_license_verified) return false;
  if (u.drivers_license_pending_review) return false;
  if (u.license_submitted_date) return false;
  return true;
};

const formatPhone = (raw) => {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (!raw.startsWith('+')) return '+' + digits;
  return '+' + digits;
};

const sendSms = async (toNumber, message, twilioConfig) => {
  const { accountSid, authToken, fromNumber } = twilioConfig;
  const formBody = new URLSearchParams({ From: fromNumber, To: toNumber, Body: message });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    }
  );
  const result = await response.json();
  if (!response.ok) return { ok: false, reason: result.message || result.code };
  return { ok: true, sid: result.sid };
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const mode = payload.mode || 'preview';

    const twilioConfig = {
      accountSid: Deno.env.get('TWILIO_ACCOUNT_SID'),
      authToken: Deno.env.get('TWILIO_AUTH_TOKEN'),
      fromNumber: Deno.env.get('TWILIO_PHONE_NUMBER'),
    };

    // ── PREVIEW: send to admin themselves ──
    if (mode === 'preview') {
      const results = { mode: 'preview', sms: null, email: null, sms_text: smsMessage, email_subject: emailSubject };

      // Send SMS preview to admin's phone if available
      if (twilioConfig.accountSid && twilioConfig.fromNumber && user.phone_number) {
        const toNumber = formatPhone(user.phone_number);
        results.sms = await sendSms(toNumber, smsMessage, twilioConfig);
        results.sms.to = toNumber;
      } else {
        results.sms = { ok: false, reason: 'No phone number on admin account or Twilio not configured' };
      }

      // Send email preview to admin
      const unsubUrl = appUrl + '/Unsubscribe?user_id=preview';
      const firstName = user.full_name ? user.full_name.split(' ')[0] : 'there';
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          from_name: "Cruise Kaua'i",
          subject: '[PREVIEW] ' + emailSubject,
          body: buildEmailHtml(firstName, unsubUrl),
        });
        results.email = { ok: true, to: user.email };
      } catch (e) {
        results.email = { ok: false, reason: e.message };
      }

      return Response.json(results);
    }

    // ── COUNT: how many would receive SMS vs email ──
    if (mode === 'count') {
      const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);
      const unverified = allUsers.filter(isUnverified);
      const smsEligible = unverified.filter(u => u.phone_number && u.sms_notifications_enabled && !u.sms_disabled_inactivity);
      const emailEligible = unverified.filter(u => u.email && !smsEligible.includes(u));
      return Response.json({
        mode: 'count',
        total_unverified: unverified.length,
        sms_count: smsEligible.length,
        email_count: emailEligible.length,
        skipped_no_contact: unverified.filter(u => !smsEligible.includes(u) && !emailEligible.includes(u)).length,
        sms_recipients_preview: smsEligible.slice(0, 10).map(u => ({ name: u.full_name, phone: u.phone_number })),
        email_recipients_preview: emailEligible.slice(0, 10).map(u => ({ name: u.full_name, email: u.email })),
      });
    }

    // ── BLAST: send to all eligible users in batches ──
    if (mode === 'blast') {
      if (!twilioConfig.accountSid || !twilioConfig.fromNumber) {
        return Response.json({ error: 'Twilio not configured' }, { status: 500 });
      }

      const skip = payload.skip || 0;
      const batchSize = payload.batch_size || 10;
      const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);
      const unverified = allUsers.filter(isUnverified);

      // Priority SMS recipients: have phone + opted in + not disabled
      const smsEligible = unverified.filter(u => u.phone_number && u.sms_notifications_enabled && !u.sms_disabled_inactivity);
      // Email recipients: have email and are NOT getting SMS
      const smsIds = new Set(smsEligible.map(u => u.id));
      const emailEligible = unverified.filter(u => u.email && !smsIds.has(u.id));

      // Combine into a single ordered list: SMS recipients first, then email
      const combined = [
        ...smsEligible.map(u => ({ user: u, channel: 'sms' })),
        ...emailEligible.map(u => ({ user: u, channel: 'email' })),
      ];

      const batch = combined.slice(skip, skip + batchSize);
      let smsSent = 0, smsErrors = 0, emailSent = 0, emailErrors = 0;
      const sleep = (ms) => new Promise(r => setTimeout(r, ms));

      for (const item of batch) {
        try {
          if (item.channel === 'sms') {
            const toNumber = formatPhone(item.user.phone_number);
            const result = await sendSms(toNumber, smsMessage, twilioConfig);
            if (result.ok) smsSent++; else smsErrors++;
          } else {
            const firstName = item.user.full_name ? item.user.full_name.split(' ')[0] : 'there';
            const unsubUrl = appUrl + '/Unsubscribe?user_id=' + item.user.id;
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: item.user.email,
              from_name: "Cruise Kaua'i",
              subject: emailSubject,
              body: buildEmailHtml(firstName, unsubUrl),
            });
            emailSent++;
          }
          await sleep(2000);
        } catch (e) {
          if (item.channel === 'sms') smsErrors++; else emailErrors++;
        }
      }

      const nextSkip = skip + batchSize;
      const hasMore = nextSkip < combined.length;

      return Response.json({
        ok: true,
        mode: 'blast',
        skip,
        next_skip: nextSkip,
        has_more: hasMore,
        total_eligible: combined.length,
        sms_sent: smsSent,
        sms_errors: smsErrors,
        email_sent: emailSent,
        email_errors: emailErrors,
      });
    }

    return Response.json({ error: 'Invalid mode. Use preview, count, or blast.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});