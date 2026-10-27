// Daily cleanup: removes road alerts not re-confirmed for 24h and relief posts older than 1 month.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const sr = base44.asServiceRole;
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    const reports = await sr.entities.RoadReport.filter({ created_date: { $lt: dayAgo } }, '-created_date', 1000);
    const staleReports = (Array.isArray(reports) ? reports : reports.items || [])
      .filter((r: any) => (r.last_confirmed_at || r.created_date) < dayAgo);
    for (const r of staleReports) await sr.entities.RoadReport.delete(r.id);

    const posts = await sr.entities.ReliefPost.filter({ created_date: { $lt: monthAgo } }, '-created_date', 1000);
    const oldPosts = Array.isArray(posts) ? posts : posts.items || [];
    for (const p of oldPosts) await sr.entities.ReliefPost.delete(p.id);

    return Response.json({ ok: true, roadReportsRemoved: staleReports.length, reliefPostsRemoved: oldPosts.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});