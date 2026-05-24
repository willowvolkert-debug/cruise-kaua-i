import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { page_name } = body;

    if (!page_name) {
      return Response.json({ error: 'page_name required' }, { status: 400 });
    }

    await base44.asServiceRole.entities.PageView.create({ page_name });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});