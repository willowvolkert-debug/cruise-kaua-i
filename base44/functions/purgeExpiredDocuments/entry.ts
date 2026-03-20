import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await base44.asServiceRole.entities.User.list();
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  let purgedLicense = 0;
  let purgedInsurance = 0;

  for (const u of users) {
    const updates = {};

    // Purge license photos if submitted more than 1 month ago
    if (
      (u.drivers_license_front_url || u.drivers_license_back_url) &&
      u.license_submitted_date &&
      new Date(u.license_submitted_date) < oneMonthAgo
    ) {
      updates.drivers_license_front_url = null;
      updates.drivers_license_back_url = null;
      purgedLicense++;
    }

    // Purge insurance photo if submitted more than 1 month ago
    if (
      u.auto_policy_photo_url &&
      u.insurance_submitted_date &&
      new Date(u.insurance_submitted_date) < oneMonthAgo
    ) {
      updates.auto_policy_photo_url = null;
      purgedInsurance++;
    }

    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.User.update(u.id, updates);
    }
  }

  return Response.json({ success: true, purgedLicense, purgedInsurance });
});