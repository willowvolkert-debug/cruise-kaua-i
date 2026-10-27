// Texts opted-in users when a new Grey Skies relief post is created.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { sendSmsToUsers, kauaiSide } from '../../shared/sms.ts';
import { matchesLocation, userIsland } from '../../shared/locations.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { entity_id } = await req.json();
    if (!entity_id) return Response.json({ ok: true, skipped: 'no id' });

    const post = await base44.asServiceRole.entities.ReliefPost.get(entity_id);
    if (!post) return Response.json({ ok: true, skipped: 'post not found' });

    const users = await base44.asServiceRole.entities.User.list('-created_date', 5000);
    const recipients = users.filter((u: any) =>
      u.notify_relief &&
      userIsland(u) === (post.island || 'Kauai') &&
      u.sms_notifications_enabled &&
      u.phone_number &&
      u.id !== post.owner_id &&
      (u.notify_relief_kinds || []).includes(post.kind) &&
      matchesLocation(u.notify_relief_locations, [post.location_text], kauaiSide(post.lat, post.lng))
    );
    if (recipients.length === 0) return Response.json({ ok: true, skipped: 'no recipients' });

    const label = post.kind === 'need' ? 'NEED' : 'RESOURCE';
    const where = post.location_text ? ` in ${post.location_text}` : '';
    const body = `Cruise Hawaiʻi Grey Skies: new ${label}${where} - ${post.title}. Open cruisehi.org to message them. STOP=optout`;
    const result = await sendSmsToUsers(recipients, body);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});