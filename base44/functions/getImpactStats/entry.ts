import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // Each island is its own silo: everything below is scoped to the chosen island.
    let island = 'Kauai';
    try { const body = await req.json(); if (body?.island) island = body.island; } catch (_) { /* no body */ }

    const users = await sr.entities.User.list('-created_date', 5000);
    const userCount = users.filter((u: any) => (u.preferred_island || 'Kauai') === island).length;

    const islandRides = await sr.entities.Ride.filter({ island }, '-created_date', 5000);
    const islandRideList = Array.isArray(islandRides) ? islandRides : islandRides.items || [];
    const islandRideIds = new Set(islandRideList.map((r: any) => r.id));

    const txs = await sr.entities.Transaction.filter({ transaction_status: 'completed' }, '-created_date', 5000);
    const txList = (Array.isArray(txs) ? txs : txs.items || []).filter((t: any) => islandRideIds.has(t.ride_id));
    const driverEarnings = txList.reduce((s: number, t: any) => s + (t.ride_amount || 0), 0);

    const result: any = {
      userCount,
      carsOffRoad: Math.max(1, Math.round(users.length / 2)),
      driverEarnings: Math.round(driverEarnings * 100) / 100,
      me: null,
    };

    let me = null;
    try { me = await base44.auth.me(); } catch (_) { me = null; }
    if (me) {
      const bookings = await sr.entities.RideBooking.filter(
        { $or: [{ passenger_id: me.id }, { driver_id: me.id }] },
        '-created_date',
        1000
      );
      const list = Array.isArray(bookings) ? bookings : bookings.items || [];
      const islandBookings = list.filter((b: any) => islandRideIds.has(b.ride_id));
      const done = islandBookings.filter((b: any) => b.booking_status === 'confirmed' || b.booking_status === 'completed');
      const seatsOnMyRides = done
        .filter((b: any) => b.driver_id === me.id)
        .reduce((s: number, b: any) => s + (b.seats_booked || 1), 0);
      const ridesTaken = done.filter((b: any) => b.passenger_id === me.id).length;
      const carsRemoved = seatsOnMyRides + ridesTaken;
      const moneyToCommunity = done.reduce((s: number, b: any) => s + (b.total_amount || 0), 0);

      // Every booking chat counts, whatever its status (including archived ones)
      let conversations = islandBookings.filter((b: any) => (b.messages || []).length > 0).length;

      const relief = await sr.entities.ReliefMessage.filter({ recipient_id: me.id }, '-created_date', 500);
      const islandPosts = await sr.entities.ReliefPost.filter({ island }, '-created_date', 1000);
      const islandPostIds = new Set((Array.isArray(islandPosts) ? islandPosts : islandPosts.items || []).map((p: any) => p.id));
      const reliefList = (Array.isArray(relief) ? relief : relief.items || []).filter((m: any) => islandPostIds.has(m.post_id));
      conversations += new Set(reliefList.map((m: any) => `${m.post_id}:${m.sender_id}`)).size;

      result.me = {
        carsRemoved,
        moneyToCommunity: Math.round(moneyToCommunity * 100) / 100,
        conversations,
      };
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});