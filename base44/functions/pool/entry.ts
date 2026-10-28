import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

async function hash(password: string, salt: string) {
  const data = new TextEncoder().encode(salt + ':' + password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function publicSchool(s: any, joined: boolean) {
  return { id: s.id, name: s.name, location: s.location, approx_students: s.approx_students, island: s.island, joined };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const { action } = body;
    const db = base44.asServiceRole.entities;

    const memberships = async () => {
      const { items } = await db.SchoolMember.filter({ user_id: user.id }, { limit: 200 });
      return new Set(items.map((m: any) => m.school_id));
    };

    if (action === 'searchSchools') {
      const q = String(body.query || '').trim().toLowerCase();
      const island = body.island;
      const mine = await memberships();
      const { items } = await db.School.filter({ island }, { limit: 500 });
      const list = items.filter((s: any) => (q ? s.name.toLowerCase().includes(q) : mine.has(s.id)));
      return Response.json({ schools: list.slice(0, 25).map((s: any) => publicSchool(s, mine.has(s.id))) });
    }

    if (action === 'registerSchool') {
      const { name, location, approx_students, password, island } = body;
      if (!name?.trim() || !location?.trim() || !password || String(password).length < 4) {
        return Response.json({ error: 'Name, location and a password (4+ characters) are required.' }, { status: 400 });
      }
      const salt = crypto.randomUUID();
      const school = await db.School.create({
        name: name.trim(),
        location: location.trim(),
        approx_students: Number(approx_students) || 0,
        island,
        password_salt: salt,
        password_hash: await hash(String(password), salt),
      });
      await db.SchoolMember.create({ school_id: school.id, user_id: user.id });
      return Response.json({ school: publicSchool(school, true) });
    }

    if (action === 'joinSchool') {
      const school = await db.School.get(body.school_id).catch((e: any) => (e.status === 404 ? null : Promise.reject(e)));
      if (!school) return Response.json({ error: 'School not found' }, { status: 404 });
      const ok = (await hash(String(body.password || ''), school.password_salt)) === school.password_hash;
      if (!ok) return Response.json({ error: 'Wrong password' }, { status: 403 });
      const mine = await memberships();
      if (!mine.has(school.id)) await db.SchoolMember.create({ school_id: school.id, user_id: user.id });
      return Response.json({ school: publicSchool(school, true) });
    }

    if (action === 'listRides') {
      const { pool_type, pool_id } = body;
      if (!pool_type || !pool_id) return Response.json({ error: 'pool_type and pool_id required' }, { status: 400 });
      if (pool_type === 'school' && user.role !== 'admin') {
        const mine = await memberships();
        if (!mine.has(pool_id)) return Response.json({ error: 'Not a member of this schoolpool' }, { status: 403 });
      }
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Honolulu' });
      const { items } = await db.PoolRide.filter(
        { pool_type, pool_id, status: 'active', departure_date: { $gte: today } },
        { sort: 'departure_date', limit: 200 }
      );
      return Response.json({ rides: items.filter((r: any) => r.seats_available > 0) });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}