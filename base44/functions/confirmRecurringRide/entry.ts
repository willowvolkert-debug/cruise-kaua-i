import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { schedule_id, date } = await req.json();

    if (!schedule_id || !date) {
      return Response.json({ error: 'Missing schedule_id or date' }, { status: 400 });
    }

    const schedules = await base44.asServiceRole.entities.RecurringSchedule.list();
    const schedule = schedules.find(s => s.id === schedule_id);

    if (!schedule) {
      return Response.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const confirmedDates = [...(schedule.confirmed_dates || [])];
    if (!confirmedDates.includes(date)) {
      confirmedDates.push(date);
      await base44.asServiceRole.entities.RecurringSchedule.update(schedule_id, { confirmed_dates: confirmedDates });
    }

    return Response.json({ success: true, trip_name: schedule.trip_name, date });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});