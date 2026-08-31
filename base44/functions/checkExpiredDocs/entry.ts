import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Runs daily via scheduled automation — no user auth needed, uses service role throughout

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const allUsers = await base44.asServiceRole.entities.User.list();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse expiry dates entered as free text by the admin. Common formats:
    // "MM/YYYY", "M/YYYY", "MM/DD/YYYY", "M/D/YYYY", "MM/DD/YY".
    // The previous code appended "T00:00:00" to these, which produced Invalid
    // Date for every non-ISO format — so no user was ever flagged as expired.
    const parseExpiryDate = (str) => {
      if (!str) return null;
      const parts = str.trim().split('/');
      if (parts.length === 2) {
        let [mm, yyyy] = parts.map(Number);
        if (yyyy < 100) yyyy += 2000;
        return new Date(yyyy, mm - 1, 1);
      }
      if (parts.length === 3) {
        let [mm, dd, yyyy] = parts.map(Number);
        if (yyyy < 100) yyyy += 2000;
        return new Date(yyyy, mm - 1, dd);
      }
      const d = new Date(str);
      return isNaN(d) ? null : d;
    };

    const expiredLicenseUsers = [];
    const expiredInsuranceUsers = [];

    for (const u of allUsers) {
      if (u.drivers_license_verified && u.license_expiry_date) {
        const expiry = parseExpiryDate(u.license_expiry_date);
        if (expiry && expiry <= today) expiredLicenseUsers.push(u);
      }
      if (u.vehicle_verified && u.insurance_expiry_date) {
        const expiry = parseExpiryDate(u.insurance_expiry_date);
        if (expiry && expiry <= today) expiredInsuranceUsers.push(u);
      }
    }

    const results = { license_expired: [], insurance_expired: [] };

    for (const u of expiredLicenseUsers) {
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