import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Get all upcoming occurrences for a schedule within the next N days
function getUpcomingOccurrences(schedule, daysAhead = 30) {
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

    const schedules = await base44.asServiceRole.entities.RecurringSchedule.list();
    const activeSchedules = schedules.filter(s => s.is_active);

    const trips = await base44.asServiceRole.entities.RecurringTrip.list();
    const users = await base44.asServiceRole.entities.User.list();
    const existingRides = await base44.asServiceRole.entities.Ride.list();

    let emailsSent = 0;
    let ridesPosted = 0;
    let ridesDeleted = 0;

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // 48 hours from now (for sending confirmation emails)
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    // 24 hours from now (deadline: if not confirmed by this point, delete the ride)
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const appUrl = 'https://cruisekauai.org';

    for (const schedule of activeSchedules) {
      const trip = trips.find(t => t.id === schedule.recurring_trip_id);
      if (!trip) continue;

      const user = users.find(u => u.id === schedule.user_id);
      if (!user) continue;

      // Get all upcoming dates for this schedule (next 30 days)
      const upcomingDates = getUpcomingOccurrences(schedule, 30);

      for (const dateStr of upcomingDates) {
        const rideDate = new Date(dateStr + 'T00:00:00');
        const confirmationSent = (schedule.confirmation_sent_dates || []).includes(dateStr);
        const isConfirmed = (schedule.confirmed_dates || []).includes(dateStr);

        // Check if a ride already exists for this date/driver/route
        const existingRide = existingRides.find(r =>
          r.driver_id === schedule.user_id &&
          r.departure_date === dateStr &&
          r.departure_location === trip.departure_location &&
          r.destination === trip.destination
        );

        // ── STEP 1: Post ride immediately if not already posted ──
        if (!existingRide && rideDate >= today) {
          const newRide = await base44.asServiceRole.entities.Ride.create({
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
          // Track in our local list so we don't double-post within the same run
          existingRides.push({ ...newRide, driver_id: user.id, departure_date: dateStr, departure_location: trip.departure_location, destination: trip.destination });
          ridesPosted++;
        }

        // ── STEP 2: Send confirmation email when ride is within 48 hours ──
        if (!confirmationSent && rideDate <= in48h && rideDate >= today) {
          const confirmUrl = `${appUrl}/ConfirmRide?schedule_id=${schedule.id}&date=${dateStr}&trip_name=${encodeURIComponent(schedule.trip_name)}`;
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: `⏰ Confirm your ride on ${dateStr} - Cruise Kauaʻi`,
            body: `<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
<div style="text-align:center;margin-bottom:24px;">
  <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Kauaʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #f97316;" />
  <p style="margin:8px 0 0 0;font-weight:bold;color:#3b82f6;font-size:15px;">Cruise Kauaʻi</p>
</div>
<h2 style="color:#3b82f6;">Aloha ${user.full_name}! 👋</h2>
<p>Your recurring ride <strong>${schedule.trip_name}</strong> is auto-posted for <strong>${dateStr}</strong>.</p>
<p>Please confirm you'll be making this trip, or it will be <strong>removed within 24 hours</strong>:</p>
<p style="text-align:center;margin:24px 0;">
  <a href="${confirmUrl}" style="background-color:#f97316;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:16px;">✅ Yes, I'm making this trip</a>
</p>
<p style="color:#6b7280;font-size:14px;">If you don't confirm within 24 hours, the ride listing will be automatically removed.</p>
<p>Mahalo,<br/>Cruise Kauaʻi Team</p>
</body></html>`
          });

          await base44.asServiceRole.entities.RecurringSchedule.update(schedule.id, {
            confirmation_sent_dates: [...(schedule.confirmation_sent_dates || []), dateStr]
          });
          // Update local copy to avoid re-sending in same run
          schedule.confirmation_sent_dates = [...(schedule.confirmation_sent_dates || []), dateStr];
          emailsSent++;
        }

        // ── STEP 3: Delete ride if 24hr window passed and not confirmed ──
        if (confirmationSent && !isConfirmed && rideDate < in24h && rideDate >= today) {
          // Find and delete the ride
          const rideToDelete = existingRides.find(r =>
            r.driver_id === schedule.user_id &&
            r.departure_date === dateStr &&
            r.departure_location === trip.departure_location &&
            r.destination === trip.destination
          );
          if (rideToDelete) {
            await base44.asServiceRole.entities.Ride.delete(rideToDelete.id);
            ridesDeleted++;
          }
        }

        // ── STEP 4: Cleanup past specific_dates ──
        if (schedule.schedule_type === 'specific_dates' && rideDate < today) {
          const remaining = (schedule.specific_dates || []).filter(d => d !== dateStr);
          await base44.asServiceRole.entities.RecurringSchedule.update(schedule.id, {
            specific_dates: remaining,
            is_active: remaining.length > 0
          });
          schedule.specific_dates = remaining;
        }
      }
    }

    return Response.json({ emailsSent, ridesPosted, ridesDeleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});