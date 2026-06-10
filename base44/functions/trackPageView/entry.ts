import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { page_name } = body;

    if (!page_name) {
      return Response.json({ error: 'page_name required' }, { status: 400 });
    }

    // Validate page_name is a reasonable string (no spam payloads)
    if (typeof page_name !== 'string' || page_name.length > 100) {
      return Response.json({ error: 'Invalid page_name' }, { status: 400 });
    }

    // Optionally attach user_id if authenticated (don't block unauthenticated views)
    let user_id = null;
    try {
      const me = await base44.auth.me();
      user_id = me?.id || null;
    } catch (_) { /* unauthenticated is fine for page tracking */ }

    await base44.asServiceRole.entities.PageView.create({ page_name, user_id });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});