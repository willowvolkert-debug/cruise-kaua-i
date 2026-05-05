import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered by entity automation when a RideBooking is created or updated
// Deletes the passenger's active RideRequests that match the booked ride's route/date
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const booking = payload.data;
    if (!booking) return Response.json({ ok: true, skipped: 'no data' });

    // Only act on paid bookings
    if (booking.payment_status !== 'paid') {
      return Response.json({ ok: true, skipped: 'not paid' });
    }

    const passengerId = booking.passenger_id;
    if (!passengerId) return Response.json({ ok: true, skipped: 'no passenger_id' });

    // Get the ride to know the route and date
    const rides = await base44.asServiceRole.entities.Ride.filter({ id: booking.ride_id });
    const ride = rides[0];
    if (!ride) return Response.json({ ok: true, skipped: 'ride not found' });

    // Find active ride requests by this passenger
    const rideRequests = await base44.asServiceRole.entities.RideRequest.filter({
      rider_id: passengerId,
      status: 'active'
    });

    let deleted = 0;
    for (const request of rideRequests) {
      // Match on same departure date and overlapping route (either direction or same locations)
      const sameDate = request.departure_date?.substring(0, 10) === ride.departure_date?.substring(0, 10);
      const sameRoute =
        (request.departure_location?.toLowerCase() === ride.departure_location?.toLowerCase() &&
         request.destination?.toLowerCase() === ride.destination?.toLowerCase()) ||
        // Also match partial/flexible routes — if request origin is a stop or vice versa
        (ride.stops?.some(s => s?.toLowerCase() === request.departure_location?.toLowerCase()) &&
         request.destination?.toLowerCase() === ride.destination?.toLowerCase());

      if (sameDate && sameRoute) {
        await base44.asServiceRole.entities.RideRequest.update(request.id, { status: 'matched' });
        deleted++;
      }
    }

    return Response.json({ ok: true, requestsMatched: deleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});