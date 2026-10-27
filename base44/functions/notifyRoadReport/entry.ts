// Texts opted-in users when a new road alert is posted on their side of the island.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { sendSmsToUsers, kauaiSide } from '../../shared/sms.ts';
import { matchesLocation, userIsland } from '../../shared/locations.ts';

const LABELS: Record<string, string> = {
  traffic: 'traffic jam', crash: 'crash', hazard: 'road hazard', closure: 'road closed',
  flooding: 'flooding', animals: 'animals on road', stalled: 'stalled car', police: 'police',
  tree_trimming: 'tree trimming', powerline: 'powerline work',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { entity_id } = await req.json();
    if (!entity_id) return Response.json({ ok: true, skipped: 'no id' });

    const report = await base44.asServiceRole.entities.RoadReport.get(entity_id);
    if (!report) return Response.json({ ok: true, skipped: 'report not found' });

    const side = kauaiSide(report.lat, report.lng);
    const users = await base44.asServiceRole.entities.User.list('-created_date', 5000);
    const recipients = users.filter((u: any) =>
      u.notify_road &&
      userIsland(u) === (report.island || 'Kauai') &&
      u.sms_notifications_enabled &&
      u.phone_number &&
      u.id !== report.reporter_id &&
      (u.notify_road_locations?.length
        ? matchesLocation(u.notify_road_locations, [report.place], side)
        : (u.notify_road_sides?.length ? u.notify_road_sides.includes(side) : true))
    );
    if (recipients.length === 0) return Response.json({ ok: true, skipped: 'no recipients' });

    const where = report.place ? ` near ${report.place}` : '';
    const body = `Cruise Hawaiʻi road alert (${side} side): ${LABELS[report.type] || 'hazard'}${where}. cruisehi.org STOP=optout`;
    const result = await sendSmsToUsers(recipients, body);
    return Response.json({ ok: true, side, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});