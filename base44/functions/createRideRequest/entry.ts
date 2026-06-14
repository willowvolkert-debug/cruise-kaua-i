import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { payload } = body;

    if (!payload) {
      return Response.json({ error: 'payload required' }, { status: 400 });
    }

    const record = await base44.asServiceRole.entities.RideRequest.create(payload);
    return Response.json({ success: true, id: record.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});