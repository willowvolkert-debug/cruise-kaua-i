import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { user_id } = await req.json();

        if (!user_id) {
            return Response.json({ error: 'User ID required' }, { status: 400 });
        }

        // Update user to unsubscribe from setup reminders
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