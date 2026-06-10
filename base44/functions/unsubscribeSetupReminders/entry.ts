import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { user_id } = await req.json();

        if (!user_id) {
            return Response.json({ error: 'User ID required' }, { status: 400 });
        }

        // Must be authenticated as the same user (or admin)
        const me = await base44.auth.me();
        if (!me) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (me.id !== user_id && me.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        await base44.asServiceRole.entities.User.update(user_id, {
            setup_reminders_unsubscribed: true
        });

        return Response.json({ 
            success: true,
            message: 'Successfully unsubscribed from setup reminders'
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});