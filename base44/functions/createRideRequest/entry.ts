import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import { locationsMatch, routeMatches } from '../../shared/locationMatching.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { payload } = body;

    if (!payload) {
      return Response.json({ error: 'payload required' }, { status: 400 });
    }

    // Create the ride request post
    const record = await base44.asServiceRole.entities.RidePost.create(payload);

    // --- Server-side driver matching (replaces client-side User.list() call) ---
    // Find drivers whose home_base matches the request's departure or destination
    // using zone-based matching, and email them.
    try {
      const allUsers = await base44.asServiceRole.entities.User.list();
      const matchingDrivers = allUsers.filter(u =>
        u.user_type === 'driver' &&
        u.home_base &&
        (locationsMatch(u.home_base, payload.departure_location) ||
         locationsMatch(u.home_base, payload.destination))
      );

      for (const driver of matchingDrivers) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: driver.email,
            subject: "Ride request in your area!",
            body: `Aloha! There is a ride request in your area!\n\n${payload.departure_location} → ${payload.destination}\nDate: ${payload.departure_date}\nTime: ${payload.departure_time}\n\nTo view the request, log onto https://cruisehi.org and go to the post a ride feature.\n\nIf you need any help matching the request, please email willowvolkert@gmail.com.`
          });
        } catch (e) { /* skip individual email failures */ }
      }

      // --- Ride-request-to-ride matching ---
      // Find active rides that match this request's route using zone-based matching,
      // and notify the rider about available matches.
      const activeRides = await base44.asServiceRole.entities.Ride.filter(
        { status: 'active' },
        { sort: '-departure_date', limit: 200 }
      );
      const rides = Array.isArray(activeRides) ? activeRides : (activeRides.items || []);

      const matchedRides = rides.filter(r =>
        routeMatches(
          r.departure_location, r.destination,
          payload.departure_location, payload.destination
        )
      );

      // If we found matching rides, email the rider about them
      if (matchedRides.length > 0 && payload.rider_id) {
        const riderUser = allUsers.find(u => u.id === payload.rider_id);
        if (riderUser?.email) {
          const rideList = matchedRides.slice(0, 5).map(r =>
            `• ${r.departure_location} → ${r.destination} on ${r.departure_date} at ${r.departure_time} (${r.seats_available} seats, $${r.price_per_seat_tourist || r.price_per_seat_local || r.price_per_seat || 0}/seat)`
          ).join('\n');

          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: riderUser.email,
              subject: `🚗 We found ${matchedRides.length} ride${matchedRides.length > 1 ? 's' : ''} matching your request!`,
              body: `Aloha ${payload.rider_name || 'there'}!\n\nGood news — there ${matchedRides.length > 1 ? 'are' : 'is'} ${matchedRides.length} ride${matchedRides.length > 1 ? 's' : ''} already posted that match your route:\n\n${rideList}\n\nLog in to view and book: https://cruisehi.org/trips\n\nMahalo,\nCruise Hawaiʻi`
            });
          } catch (e) { /* skip email failure */ }
        }
      }
    } catch (matchErr) {
      // Matching is best-effort — don't fail the request if it errors
      console.error('Driver matching error:', matchErr);
    }

    return Response.json({ success: true, id: record.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});