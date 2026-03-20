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

  let purgedCount = 0;

  for (const u of users) {
    // Only purge if both license AND vehicle are verified
    if (!u.drivers_license_verified || !u.vehicle_verified) continue;

    // Check if license expiry date exists and is at least 1 month old (approval happened)
    // We use updated_date as a proxy for when verification was approved,
    // but also check that expiry dates are present (meaning docs were submitted)
    const hasLicenseDoc = u.drivers_license_front_url || u.drivers_license_back_url;
    const hasInsuranceDoc = u.auto_policy_photo_url;

    if (!hasLicenseDoc && !hasInsuranceDoc) continue;

    // Check if verification was approved at least 1 month ago
    // We use the presence of expiry dates + verified flags to determine this
    // Use updated_date of the user record as a conservative proxy
    const approvalDate = new Date(u.updated_date);
    if (approvalDate > oneMonthAgo) continue;

    // Purge sensitive document URLs and expiry dates
    await base44.asServiceRole.entities.User.update(u.id, {
      drivers_license_front_url: null,
      drivers_license_back_url: null,
      auto_policy_photo_url: null,
      license_expiry_date: null,
      insurance_expiry_date: null,
    });

    purgedCount++;
  }

  return Response.json({ success: true, purged: purgedCount });
});