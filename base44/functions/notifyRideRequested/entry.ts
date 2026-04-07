import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const request = payload.data;

    if (!request) return Response.json({ ok: true, skipped: 'no data' });

    const allUsers = await base44.asServiceRole.entities.User.list();

    const emailPromises = allUsers
      .filter(u => u.email && u.id !== request.rider_id)
      .map(u =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          subject: `🙋 New ride request: ${request.departure_location} → ${request.destination}`,
          body: `Aloha ${u.full_name || 'there'}!\n\nSomeone is looking for a ride on Cruise Kauaʻi!\n\n📍 Route: ${request.departure_location} → ${request.destination}\n📅 Date: ${request.departure_date} at ${request.departure_time}\n💺 Seats needed: ${request.seats_needed}\n🙋 Rider: ${request.rider_name}\n\nIf you're driving that route, open the app to connect with them!\n\nMahalo,\nThe Cruise Kauaʻi Team`
        }).catch(() => null)
      );

    await Promise.all(emailPromises);

    return Response.json({ ok: true, sent: emailPromises.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});