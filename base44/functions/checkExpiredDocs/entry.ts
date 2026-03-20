import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredLicenseUsers = [];
    const expiredInsuranceUsers = [];

    for (const u of allUsers) {
      if (u.drivers_license_verified && u.license_expiry_date) {
        const expiry = new Date(u.license_expiry_date + 'T00:00:00');
        if (expiry <= today) {
          expiredLicenseUsers.push(u);
        }
      }
      if (u.vehicle_verified && u.insurance_expiry_date) {
        const expiry = new Date(u.insurance_expiry_date + 'T00:00:00');
        if (expiry <= today) {
          expiredInsuranceUsers.push(u);
        }
      }
    }

    const results = { license_expired: [], insurance_expired: [] };

    for (const u of expiredLicenseUsers) {
      // Check if we already sent an alert recently (avoid duplicates)
      const existing = await base44.asServiceRole.entities.AdminMessage.filter({
        recipient_id: 'admin',
        subject: `⚠️ Expired License: ${u.full_name}`
      });
      if (existing.length === 0) {
        await base44.asServiceRole.entities.AdminMessage.create({
          recipient_id: 'admin',
          recipient_name: 'Admin',
          subject: `⚠️ Expired License: ${u.full_name}`,
          message: `${u.full_name} (${u.email})'s driver's license expired on ${u.license_expiry_date}. Please message them to re-verify their license.`,
          message_type: 'action_required'
        });
        results.license_expired.push(u.full_name);
      }
    }

    for (const u of expiredInsuranceUsers) {
      const existing = await base44.asServiceRole.entities.AdminMessage.filter({
        recipient_id: 'admin',
        subject: `⚠️ Expired Insurance: ${u.full_name}`
      });
      if (existing.length === 0) {
        await base44.asServiceRole.entities.AdminMessage.create({
          recipient_id: 'admin',
          recipient_name: 'Admin',
          subject: `⚠️ Expired Insurance: ${u.full_name}`,
          message: `${u.full_name} (${u.email})'s vehicle insurance expired on ${u.insurance_expiry_date}. Please message them to re-verify their insurance card.`,
          message_type: 'action_required'
        });
        results.insurance_expired.push(u.full_name);
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});