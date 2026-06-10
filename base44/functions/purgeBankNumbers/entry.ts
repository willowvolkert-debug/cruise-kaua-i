import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// One-time cleanup: truncate all stored bank account/routing numbers to last 4 digits only

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    let cleaned = 0;

    for (const u of allUsers) {
      const hasFullRouting = u.bank_routing_number && u.bank_routing_number.length > 4;
      const hasFullAccount = u.bank_account_number && u.bank_account_number.length > 4;

      if (hasFullRouting || hasFullAccount) {
        await base44.asServiceRole.entities.User.update(u.id, {
          bank_routing_number: hasFullRouting ? u.bank_routing_number.slice(-4) : u.bank_routing_number,
          bank_account_number: hasFullAccount ? u.bank_account_number.slice(-4) : u.bank_account_number,
        });
        cleaned++;
      }
    }

    return Response.json({ ok: true, cleaned });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});