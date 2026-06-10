import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Must be authenticated
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { scheduleId, dateStr, email } = await req.json();

    const schedules = await base44.asServiceRole.entities.RecurringSchedule.list();
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return Response.json({ error: 'Schedule not found' }, { status: 404 });

    // Only the schedule owner or an admin can request a resend
    if (schedule.user_id !== me.id && me.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await base44.asServiceRole.entities.User.list();
    const user = users.find(u => u.email === email);
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    const confirmUrl = `https://cruisekauai.base44.app/ConfirmRide?schedule_id=${schedule.id}&date=${dateStr}`;
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: `⏰ Confirm your auto-posted ride on ${dateStr} - Cruise Kauaʻi`,
      body: `<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
<h2 style="color:#3b82f6;">Aloha ${user.full_name}! 👋</h2>
<p>Your recurring ride <strong>${schedule.trip_name}</strong> is scheduled to auto-post for <strong>${dateStr}</strong>.</p>
<p>Please confirm you'll be making this trip:</p>
<p><a href="${confirmUrl}" style="background-color:#f97316;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:16px;">✅ Confirm My Ride</a></p>
<p style="color:#6b7280;font-size:14px;">If you don't confirm, the ride will <strong>not</strong> be posted.</p>
<p>Mahalo,<br/>Cruise Kauaʻi Team</p>
</body></html>`
    });

    return Response.json({ success: true, sentTo: user.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});