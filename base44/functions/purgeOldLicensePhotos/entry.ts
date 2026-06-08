import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Runs daily — clears license photo URLs for users whose license was verified 2+ weeks ago

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const allUsers = await base44.asServiceRole.entities.User.list();
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    let cleared = 0;
    for (const user of allUsers) {
      // Only target verified users who still have license photo URLs
      if (
        user.drivers_license_verified &&
        (user.drivers_license_front_url || user.drivers_license_back_url) &&
        user.updated_date &&
        new Date(user.updated_date) < twoWeeksAgo
      ) {
        await base44.asServiceRole.entities.User.update(user.id, {
          drivers_license_front_url: null,
          drivers_license_back_url: null,
        });
        cleared++;
      }
    }

    return Response.json({ ok: true, cleared });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});