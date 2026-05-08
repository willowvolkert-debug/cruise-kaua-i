import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // For scheduled runs, use service role
    const recurringRequests = await base44.asServiceRole.entities.RecurringRideRequest.list();
    const activeRecurring = recurringRequests.filter(r => r.is_active);

    if (activeRecurring.length === 0) {
      return Response.json({ message: 'No active recurring ride requests', posted: 0 });
    }

    // Get today's day of week in Hawaii time (UTC-10)
    const now = new Date();
    const hawaiiOffset = -10 * 60;
    const hawaiiTime = new Date(now.getTime() + (hawaiiOffset + now.getTimezoneOffset()) * 60000);
    const todayDayOfWeek = hawaiiTime.getDay(); // 0=Sun...6=Sat
    const todayDateStr = hawaiiTime.toISOString().split('T')[0];

    let posted = 0;

    for (const recurring of activeRecurring) {
      // Check if today is one of the scheduled days
      const days = recurring.weekly_days || [];
      if (!days.includes(todayDayOfWeek)) continue;

      // Check if we already posted a request for this recurring today
      const existingToday = await base44.asServiceRole.entities.RideRequest.filter({
        rider_id: recurring.user_id,
        departure_location: recurring.departure_location,
        destination: recurring.destination,
        departure_date: todayDateStr,
      });

      if (existingToday.length > 0) continue;

      // Post the ride request
      await base44.asServiceRole.entities.RideRequest.create({
        departure_location: recurring.departure_location,
        destination: recurring.destination,
        stops: recurring.stops || [],
        departure_date: todayDateStr,
        departure_time: recurring.departure_time,
        is_flexible: recurring.is_flexible || false,
        seats_needed: recurring.seats_needed || 1,
        description: recurring.description || '',
        has_luggage: recurring.has_luggage || false,
        rider_id: recurring.user_id,
        rider_name: recurring.rider_name,
        rider_username: recurring.rider_username || null,
        rider_profile_picture_url: recurring.rider_profile_picture_url || null,
        rider_bio: recurring.rider_bio || null,
        rider_age: recurring.rider_age || null,
        rider_gender: recurring.rider_gender || null,
        status: 'active',
      });

      posted++;
    }

    return Response.json({ message: `Posted ${posted} recurring ride requests`, posted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});