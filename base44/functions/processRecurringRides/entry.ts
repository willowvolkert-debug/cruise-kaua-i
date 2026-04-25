import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function getNextOccurrences(schedule, daysAhead = 3) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const results = [];

  if (schedule.schedule_type === 'weekly') {
    const days = schedule.weekly_days || [];
    for (let i = 0; i <= daysAhead; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      if (days.includes(d.getDay())) {
        results.push(d.toISOString().split('T')[0]);
      }
    }
  } else if (schedule.schedule_type === 'monthly') {
    const dayOfMonth = schedule.monthly_day;
    for (let i = 0; i <= daysAhead; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      if (d.getDate() === dayOfMonth) {
        results.push(d.toISOString().split('T')[0]);
      }
    }
  } else if (schedule.schedule_type === 'specific_dates') {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + daysAhead);
    for (const dateStr of (schedule.specific_dates || [])) {
      const d = new Date(dateStr + 'T00:00:00');
      if (d >= today && d <= cutoff) {
        results.push(dateStr);
      }
    }
  }

  return results;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active schedules
    const schedules = await base44.asServiceRole.entities.RecurringSchedule.list();
    const activeSchedules = schedules.filter(s => s.is_active);

    let emailsSent = 0;
    let ridesPosted = 0;
    let ridesDeleted = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Tomorrow for 48hr check
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const twoDaysStr = twoDaysFromNow.toISOString().split('T')[0];

    for (const schedule of activeSchedules) {
      // Get the recurring trip template
      let trip;
      try {
        const trips = await base44.asServiceRole.entities.RecurringTrip.list();
        trip = trips.find(t => t.id === schedule.recurring_trip_id);
      } catch (e) {
        continue;
      }
      if (!trip) continue;

      // Get user
      const users = await base44.asServiceRole.entities.User.list();
      const user = users.find(u => u.id === schedule.user_id);
      if (!user) continue;

      // Get upcoming dates for this schedule (next 3 days window)
      const upcomingDates = getNextOccurrences(schedule, 3);

      for (const dateStr of upcomingDates) {
        const confirmationSent = (schedule.confirmation_sent_dates || []).includes(dateStr);
        const isConfirmed = (schedule.confirmed_dates || []).includes(dateStr);

        // Send confirmation email if ride is within 48 hours and no confirmation sent yet
        // This covers: tomorrow (1 day away) and 2 days away
        const rideDate = new Date(dateStr + 'T00:00:00');
        const isWithin48Hours = rideDate <= twoDaysFromNow && rideDate >= today;

        if (isWithin48Hours && !confirmationSent) {
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

          // Mark confirmation sent
          await base44.asServiceRole.entities.RecurringSchedule.update(schedule.id, {
            confirmation_sent_dates: [...(schedule.confirmation_sent_dates || []), dateStr]
          });
          emailsSent++;
        }

        // If date is today and confirmed — post the ride
        if (dateStr === todayStr && isConfirmed) {
          // Check if ride already posted for this date/trip
          const existingRides = await base44.asServiceRole.entities.Ride.list();
          const alreadyPosted = existingRides.find(r =>
            r.driver_id === schedule.user_id &&
            r.departure_date === dateStr &&
            r.departure_location === trip.departure_location &&
            r.destination === trip.destination
          );

          if (!alreadyPosted) {
            await base44.asServiceRole.entities.Ride.create({
              departure_location: trip.departure_location,
              destination: trip.destination,
              stops: trip.stops || [],
              departure_date: dateStr,
              departure_time: trip.departure_time,
              is_flexible: trip.is_flexible,
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
              status: 'active'
            });
            ridesPosted++;
          }
        }

        // If date is today and NOT confirmed and confirmation was sent — skip (don't post)
        // Cleanup: remove past dates from specific_dates schedules
        if (schedule.schedule_type === 'specific_dates') {
          const pastDate = new Date(dateStr + 'T00:00:00') < today;
          if (pastDate) {
            const remaining = (schedule.specific_dates || []).filter(d => d !== dateStr);
            await base44.asServiceRole.entities.RecurringSchedule.update(schedule.id, {
              specific_dates: remaining,
              is_active: remaining.length > 0
            });
          }
        }
      }
    }

    return Response.json({ emailsSent, ridesPosted, ridesDeleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});