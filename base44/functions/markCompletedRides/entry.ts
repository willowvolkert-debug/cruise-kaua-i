import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Scheduled daily — marks rides (and their confirmed bookings) as completed
// once the ride's departure date has fully passed. Ride completion also sets
// needs_rating so the rating flow can fire. Same-day rides are left alone and
// completed on the next day's run (avoids marking in-progress trips done).

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Today's date in HST (Pacific/Honolulu) as YYYY-MM-DD
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Pacific/Honolulu',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const rides = await base44.asServiceRole.entities.Ride.list();

    let ridesCompleted = 0;
    let bookingsCompleted = 0;

    for (const ride of rides) {
      if (ride.status !== 'active' && ride.status !== 'full') continue;
      const depDate = ride.departure_date?.substring(0, 10);
      if (!depDate || depDate >= todayStr) continue;

      // Mark the ride completed and flag it for ratings
      await base44.asServiceRole.entities.Ride.update(ride.id, {
        status: 'completed',
        needs_rating: true,
      });
      ridesCompleted++;

      // Mark all confirmed bookings on this ride as completed
      const res = await base44.asServiceRole.entities.RideBooking.updateMany(
        { ride_id: ride.id, booking_status: 'confirmed' },
        { $set: { booking_status: 'completed' } }
      );
      if (res && typeof res.updated === 'number') {
        bookingsCompleted += res.updated;
      }
    }

    return Response.json({ ok: true, ridesCompleted, bookingsCompleted, asOf: todayStr });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});