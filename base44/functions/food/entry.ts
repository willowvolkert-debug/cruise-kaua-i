import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { action, id } = await req.json().catch(() => ({}));
    const db = base44.asServiceRole.entities;
    const request = await db.FoodRequest.get(id).catch((e: any) => (e.status === 404 ? null : Promise.reject(e)));
    if (!request) return Response.json({ error: 'Request not found' }, { status: 404 });

    if (action === 'claim') {
      if (user.delivers_food !== true) return Response.json({ error: 'Turn on food deliveries first' }, { status: 403 });
      if (request.requester_id === user.id) return Response.json({ error: 'You cannot claim your own request' }, { status: 400 });
      if (request.status !== 'open') return Response.json({ error: 'Already claimed' }, { status: 409 });
      const updated = await db.FoodRequest.update(id, { status: 'claimed', driver_id: user.id, driver_name: user.full_name });
      return Response.json({ request: updated });
    }

    if (action === 'unclaim') {
      if (request.driver_id !== user.id || request.status !== 'claimed') return Response.json({ error: 'Not allowed' }, { status: 403 });
      const updated = await db.FoodRequest.update(id, { status: 'open', driver_id: '', driver_name: '' });
      return Response.json({ request: updated });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}