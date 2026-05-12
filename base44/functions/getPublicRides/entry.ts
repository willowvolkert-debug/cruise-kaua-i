import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { start_date, end_date } = body;

    const allRides = await base44.asServiceRole.entities.Ride.list("-departure_date");
    const filtered = allRides.filter(r => {
      if (r.status !== 'active') return false;
      if (start_date && r.departure_date < start_date) return false;
      if (end_date && r.departure_date > end_date) return false;
      return true;
    });

    return Response.json({ rides: filtered });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});