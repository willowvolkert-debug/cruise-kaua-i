import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all bookings that have messages
    const allBookings = await base44.asServiceRole.entities.RideBooking.list();
    const bookingsWithMessages = allBookings.filter(b => b.messages && b.messages.length > 0);

    const now = Date.now();
    let clearedCount = 0;

    for (const booking of bookingsWithMessages) {
      // Find the timestamp of the most recent message
      const lastMessage = booking.messages.reduce((latest, msg) => {
        const msgTime = new Date(msg.timestamp).getTime();
        return msgTime > latest ? msgTime : latest;
      }, 0);

      if (lastMessage > 0 && (now - lastMessage) > TWO_WEEKS_MS) {
        await base44.asServiceRole.entities.RideBooking.update(booking.id, { messages: [] });
        clearedCount++;
      }
    }

    return Response.json({ ok: true, bookingsCleaned: clearedCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});