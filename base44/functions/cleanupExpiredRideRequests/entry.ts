import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Scheduled daily — deletes RideRequests whose departure_date has passed

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().substring(0, 10);

    // Fetch all active ride requests
    const requests = await base44.asServiceRole.entities.RideRequest.list();

    let expired = 0;
    for (const r of requests) {
      const depDate = r.departure_date?.substring(0, 10);
      // Only expire requests that are still active and whose date has passed
      if (depDate && depDate < todayStr && r.status === 'active') {
        await base44.asServiceRole.entities.RideRequest.update(r.id, { status: 'expired' });
        expired++;
      }
    }

    return Response.json({ ok: true, expired });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});