import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function getUpcomingOccurrences(schedule, daysAhead = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const results = [];

  if (schedule.schedule_type === 'weekly') {
    const days = schedule.weekly_days || [];
    for (let i = 0; i <= daysAhead; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      if (days.includes(d.getDay())) results.push(d.toISOString().split('T')[0]);
    }
  } else if (schedule.schedule_type === 'monthly') {
    const dayOfMonth = schedule.monthly_day;
    for (let i = 0; i <= daysAhead; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      if (d.getDate() === dayOfMonth) results.push(d.toISOString().split('T')[0]);
    }
  } else if (schedule.schedule_type === 'specific_dates') {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + daysAhead);
    for (const dateStr of (schedule.specific_dates || [])) {
      const d = new Date(dateStr + 'T00:00:00');
      if (d >= today && d <= cutoff) results.push(dateStr);
    }
  }

  return results;
}

async function runInBatches(items, fn, batchSize = 5) {
  for (let i = 0; i < items.length; i += batchSize) {
    await Promise.all(items.slice(i, i + batchSize).map(fn));
    if (i + batchSize < items.length) await sleep(300);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const [schedules, trips, users, existingRides] = await Promise.all([
      base44.asServiceRole.entities.RecurringSchedule.list(),
      base44.asServiceRole.entities.RecurringTrip.list(),
      base44.asServiceRole.entities.User.list('-created_date', 500),
      base44.asServiceRole.entities.Ride.list('-departure_date', 1000),
    ]);

    const activeSchedules = schedules.filter(s => s.is_active);

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const appUrl = 'https://cruisekauai.org';

    // ── Collect all work to be done ──
    const ridesToCreate = [];
    const emailsToSend = [];
    const schedulesToUpdateConfirmation = []; // { scheduleId, dateStr, currentDates }
    const ridesToDelete = [];
    const specificDateCleanups = []; // { scheduleId, remaining }

    // Build a lookup set for fast existing ride checks
    const existingRideSet = new Set(
      existingRides.map(r => `${r.driver_id}|${r.departure_date}|${r.departure_location}|${r.destination}`)
    );

    for (const schedule of activeSchedules) {
      const trip = trips.find(t => t.id === schedule.recurring_trip_id);
      if (!trip) continue;
      const user = users.find(u => u.id === schedule.user_id);
      if (!user) continue;

      const upcomingDates = getUpcomingOccurrences(schedule, 30).filter(dateStr => {
        if (!schedule.end_date) return true;
        return dateStr <= schedule.end_date;
      });

      for (const dateStr of upcomingDates) {
        const rideDate = new Date(dateStr + 'T00:00:00');
        const confirmationSent = (schedule.confirmation_sent_dates || []).includes(dateStr);
        const isConfirmed = (schedule.confirmed_dates || []).includes(dateStr);
        const rideKey = `${schedule.user_id}|${dateStr}|${trip.departure_location}|${trip.destination}`;
        const hasExistingRide = existingRideSet.has(rideKey);

        // STEP 1: Queue ride creation if not already posted
        if (!hasExistingRide && rideDate >= today) {
          ridesToCreate.push({ schedule, trip, user, dateStr });
          existingRideSet.add(rideKey); // prevent duplicates within same run
        }

        // STEP 2: Confirmation emails disabled — recurring rides auto-post without driver confirmation
        // if (!confirmationSent && rideDate <= in48h && rideDate >= today) {
        //   emailsToSend.push({ schedule, user, dateStr });
        //   schedulesToUpdateConfirmation.push({
        //     scheduleId: schedule.id,
        //     newDates: [...(schedule.confirmation_sent_dates || []), dateStr]
        //   });
        //   schedule.confirmation_sent_dates = [...(schedule.confirmation_sent_dates || []), dateStr];
        // }

        // STEP 3: Auto-delete disabled — rides are no longer removed for missing confirmation
        // if (confirmationSent && !isConfirmed && rideDate < in24h && rideDate >= today) {
        //   const rideToDelete = existingRides.find(r =>
        //     r.driver_id === schedule.user_id &&
        //     r.departure_date === dateStr &&
        //     r.departure_location === trip.departure_location &&
        //     r.destination === trip.destination
        //   );
        //   if (rideToDelete) ridesToDelete.push(rideToDelete.id);
        // }

        // STEP 4: Queue cleanup of past specific_dates
        if (schedule.schedule_type === 'specific_dates' && rideDate < today) {
          const remaining = (schedule.specific_dates || []).filter(d => d !== dateStr);
          specificDateCleanups.push({
            scheduleId: schedule.id,
            remaining,
            isActive: remaining.length > 0
          });
          schedule.specific_dates = remaining; // prevent duplicate cleanup in same run
        }
      }
    }

    // ── Execute all work in batches ──

    // Create rides
    let ridesPosted = 0;
    await runInBatches(ridesToCreate, async ({ trip, user, dateStr }) => {
      await base44.asServiceRole.entities.Ride.create({
        departure_location: trip.departure_location,
        destination: trip.destination,
        stops: trip.stops || [],
        departure_date: dateStr,
        departure_time: trip.departure_time,
        is_flexible: trip.is_flexible || false,
        seats_available: trip.seats_available,
        price_per_seat: trip.price_per_seat || 0,
        price_per_seat_local: trip.price_per_seat_local || 0,
        price_per_seat_tourist: trip.price_per_seat_tourist || 0,
        rider_preference: trip.rider_preference || 'both_fine',
        description: trip.description || '',
        car_model: trip.car_model || '',
        smoking_allowed: trip.smoking_allowed || false,
        pets_allowed: trip.pets_allowed || false,
        offers_detour_service: trip.offers_detour_service || false,
        driver_id: user.id,
        driver_name: user.full_name,
        driver_username: user.username || null,
        driver_profile_picture_url: user.profile_picture_url || null,
        driver_bio: user.bio || null,
        driver_age: user.age || null,
        driver_gender: user.gender || null,
        driver_license_state: user.drivers_license_state || 'HI',
        driver_vehicle_exterior_photo_url: user.vehicle_exterior_photo_url || null,
        driver_vehicle_interior_photo_urls: user.vehicle_interior_photo_urls || [],
        status: 'active',
        is_recurring: true
      });
      ridesPosted++;
    }, 5);

    // Send confirmation emails + in-app notifications
    let emailsSent = 0;
    await runInBatches(emailsToSend, async ({ schedule, user, dateStr }) => {
      const confirmUrl = `${appUrl}/ConfirmRide?schedule_id=${schedule.id}&date=${dateStr}&trip_name=${encodeURIComponent(schedule.trip_name)}`;
      await Promise.all([
        base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: `⏰ Confirm your ride on ${dateStr} - Cruise Hawaiʻi`,
          body: `<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background-color:#f5f0e8;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr><td align="center" style="padding:32px 24px 20px;border-bottom:1px solid #f0ebe0;">
        <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Hawaiʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #2f7d52;display:block;margin:0 auto 10px;" />
        <div style="font-family:Georgia,serif;font-size:1.3rem;font-weight:700;color:#1a1a1a;">Confirm your recurring ride</div>
      </td></tr>
      <tr><td style="padding:32px 32px 24px;">
        <div style="background:#fff3cd;border-left:4px solid #e8742a;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
          <p style="margin:0;font-weight:600;color:#d48806;font-size:0.9rem;">⏰ Action required</p>
        </div>
        <h1 style="font-family:Georgia,serif;font-size:1.5rem;font-weight:700;color:#1a1a1a;margin:0 0 12px;">Aloha ${user.username || user.full_name}! 🤙</h1>
        <p style="font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 24px;">Your recurring ride <strong>"${schedule.trip_name}"</strong> is auto-posted for <strong>${dateStr}</strong>. Please confirm you'll be making this trip — if not confirmed within 24 hours, the listing will be automatically removed.</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding:8px 0 24px;">
            <a href="${confirmUrl}" style="display:inline-block;background:#2f7d52;color:#ffffff;text-decoration:none;font-weight:600;font-size:1rem;padding:14px 36px;border-radius:50px;">✅ Confirm I'm Making This Trip →</a>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:12px;padding:14px 16px;margin-bottom:24px;">
          <tr><td>
            <p style="margin:0;font-size:0.85rem;color:#166534;line-height:1.5;">💡 Or simply reply to this email with <strong>confirm</strong> and we'll take care of it for you.</p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="background:#faf7f2;border-top:1px solid #ede5d4;padding:20px 32px;text-align:center;">
        <p style="font-size:0.78rem;color:#aaa;line-height:1.6;margin:0;">— The Cruise Hawaiʻi Team</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
        }),
        base44.asServiceRole.entities.AdminMessage.create({
          recipient_id: user.id,
          recipient_name: user.full_name,
          recipient_email: user.email,
          subject: `⏰ Confirm your recurring ride on ${dateStr}`,
          message: `Your recurring ride "${schedule.trip_name}" is auto-posted for ${dateStr}. Please confirm you'll be making this trip — if not confirmed within 24 hours, the listing will be automatically removed.\n\nTap here to confirm: ${confirmUrl}`,
          message_type: 'action_required'
        })
      ]);
      emailsSent++;
    }, 5);

    // Update schedule confirmation_sent_dates
    await runInBatches(schedulesToUpdateConfirmation, async ({ scheduleId, newDates }) => {
      await base44.asServiceRole.entities.RecurringSchedule.update(scheduleId, {
        confirmation_sent_dates: newDates
      });
    }, 10);

    // Delete unconfirmed rides
    let ridesDeleted = 0;
    await runInBatches(ridesToDelete, async (rideId) => {
      await base44.asServiceRole.entities.Ride.delete(rideId);
      ridesDeleted++;
    }, 10);

    // Cleanup specific_dates
    await runInBatches(specificDateCleanups, async ({ scheduleId, remaining, isActive }) => {
      await base44.asServiceRole.entities.RecurringSchedule.update(scheduleId, {
        specific_dates: remaining,
        is_active: isActive
      });
    }, 10);

    return Response.json({ emailsSent, ridesPosted, ridesDeleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});