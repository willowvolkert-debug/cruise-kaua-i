import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await req.json();

    const users = await base44.asServiceRole.entities.User.list();
    const target = users.find(u => u.id === userId);

    if (!target) {
        return Response.json({ error: 'User not found' }, { status: 404 });
    }

    await base44.asServiceRole.entities.User.update(userId, {
        has_seen_welcome: false,
        has_seen_tutorial: false,
    });

    return Response.json({ success: true });
});