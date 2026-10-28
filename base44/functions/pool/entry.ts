import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import Stripe from 'npm:stripe';
import { carpoolConnectFee, schoolConnectFee } from '../../shared/fees.ts';

async function hash(password: string, salt: string) {
  const data = new TextEncoder().encode(salt + ':' + password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function publicSchool(s: any, joined: boolean) {
  return { id: s.id, name: s.name, location: s.location, approx_students: s.approx_students, island: s.island, joined };
}

const cents = (n: number) => Math.round(n * 100);
const money = (n: number) => Math.round(n * 100) / 100;

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

    const assertCanUsePool = async (pool_type: string, pool_id: string) => {
      if (pool_type === 'school' && user.role !== 'admin') {
        const mine = await memberships();
        if (!mine.has(pool_id)) return false;
      }
      return true;
    };

    const getBooking = (id: string) => db.PoolBooking.get(id).catch((e: any) => (e.status === 404 ? null : Promise.reject(e)));

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
      if (!(await assertCanUsePool(pool_type, pool_id))) return Response.json({ error: 'Not a member of this schoolpool' }, { status: 403 });
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Honolulu' });
      const { items } = await db.PoolRide.filter(
        { pool_type, pool_id, status: 'active', departure_date: { $gte: today } },
        { sort: 'departure_date', limit: 200 }
      );
      return Response.json({ rides: items.filter((r: any) => r.seats_available > 0) });
    }

    if (action === 'book') {
      const { ride_id, note, origin } = body;
      const seats = Math.floor(Number(body.seats));
      const ride = await db.PoolRide.get(ride_id).catch((e: any) => (e.status === 404 ? null : Promise.reject(e)));
      if (!ride || ride.status !== 'active') return Response.json({ error: 'Ride not available' }, { status: 404 });
      if (ride.driver_id === user.id) return Response.json({ error: 'You cannot book your own ride' }, { status: 400 });
      if (!(await assertCanUsePool(ride.pool_type, ride.pool_id))) return Response.json({ error: 'Not a member of this schoolpool' }, { status: 403 });
      if (!(seats >= 1) || seats > ride.seats_available) return Response.json({ error: 'Invalid number of seats' }, { status: 400 });

      const isLocal = user.has_hawaii_id === true;
      const isSchool = ride.pool_type === 'school';
      const perSeat = isSchool
        ? Number(ride.price_per_seat ?? 0)
        : Number((isLocal ? ride.price_per_seat_local : ride.price_per_seat_tourist) ?? ride.price_per_seat ?? 0);
      const rideAmount = money(seats * (perSeat > 0 ? perSeat : 0));
      const connectFee = isSchool ? schoolConnectFee(rideAmount) : carpoolConnectFee(isLocal, rideAmount);
      const subtotal = rideAmount + connectFee;
      const cardFee = money(subtotal * 0.03);
      const total = money(subtotal + cardFee);

      const booking = await db.PoolBooking.create({
        ride_id: ride.id,
        pool_type: ride.pool_type,
        pool_id: ride.pool_id,
        pool_name: ride.pool_name,
        ride_summary: `${ride.departure_location} → ${ride.destination}`,
        ride_date: ride.departure_date,
        ride_time: ride.departure_time,
        driver_id: ride.driver_id,
        driver_name: ride.driver_name,
        passenger_id: user.id,
        passenger_name: user.full_name,
        seats,
        note: note || '',
        status: 'pending',
        price_per_seat: perSeat,
        ride_amount: rideAmount,
        connect_fee: connectFee,
        total_charged: total,
        payment_status: rideAmount > 0 ? 'pending' : 'none',
      });

      if (rideAmount <= 0) return Response.json({ booking });

      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
      const appOrigin = req.headers.get('origin') || origin;
      const returnPath = ride.pool_type === 'school' ? '/schoolpool' : '/partypool';
      const line = (name: string, description: string, amount: number) => ({
        price_data: { currency: 'usd', product_data: { name, description }, unit_amount: cents(amount) },
        quantity: 1,
      });
      const lineItems = [
        line('Cruise Hawaiʻi Ride', `${booking.ride_summary} on ${ride.departure_date} at ${ride.departure_time} · ${seats} seat${seats > 1 ? 's' : ''}`, rideAmount),
        line('Connect Fee', 'Cruise Hawaiʻi service fee (flat per ride)', connectFee),
        line('Credit Card Fee', 'Payment processing fee (3%)', cardFee),
      ];
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: user.email,
        line_items: lineItems,
        metadata: { pool_booking_id: booking.id, passenger_id: user.id, driver_id: ride.driver_id },
        success_url: `${appOrigin}${returnPath}?pool_session={CHECKOUT_SESSION_ID}&pool_booking=${booking.id}`,
        cancel_url: `${appOrigin}${returnPath}`,
      });
      await db.PoolBooking.update(booking.id, { stripe_session_id: session.id });
      return Response.json({ booking, checkout_url: session.url });
    }

    if (action === 'confirmPayment') {
      const booking = await getBooking(body.booking_id);
      if (!booking || booking.passenger_id !== user.id) return Response.json({ error: 'Booking not found' }, { status: 404 });
      if (booking.payment_status === 'paid') return Response.json({ booking });
      if (!booking.stripe_session_id) return Response.json({ error: 'No payment to confirm' }, { status: 400 });
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
      const session = await stripe.checkout.sessions.retrieve(booking.stripe_session_id);
      if (session.payment_status !== 'paid') return Response.json({ error: 'Payment not completed' }, { status: 402 });
      const updated = await db.PoolBooking.update(booking.id, { payment_status: 'paid', stripe_payment_intent: session.payment_intent });
      return Response.json({ booking: updated });
    }

    if (action === 'setStatus') {
      const { status } = body;
      const booking = await getBooking(body.booking_id);
      if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
      const isDriver = booking.driver_id === user.id;
      const isPassenger = booking.passenger_id === user.id;
      const allowed =
        (status === 'confirmed' && isDriver && booking.status === 'pending') ||
        (status === 'declined' && isDriver && booking.status === 'pending') ||
        (status === 'cancelled' && isPassenger && ['pending', 'confirmed'].includes(booking.status));
      if (!allowed) return Response.json({ error: 'Not allowed' }, { status: 403 });

      const stripe = booking.payment_status === 'pending' || booking.payment_status === 'paid' ? new Stripe(Deno.env.get('STRIPE_SECRET_KEY')) : null;
      let payment_status = booking.payment_status;

      if (status === 'confirmed') {
        if (payment_status === 'pending' && stripe && booking.stripe_session_id) {
          const session = await stripe.checkout.sessions.retrieve(booking.stripe_session_id);
          if (session.payment_status === 'paid') {
            payment_status = 'paid';
            await db.PoolBooking.update(booking.id, { payment_status, stripe_payment_intent: session.payment_intent });
          }
        }
        if (payment_status === 'pending') return Response.json({ error: 'Rider has not completed payment yet' }, { status: 402 });
        const ride = await db.PoolRide.get(booking.ride_id);
        if (ride.seats_available < booking.seats) return Response.json({ error: 'Not enough seats left' }, { status: 400 });
        await db.PoolRide.update(ride.id, { seats_available: ride.seats_available - booking.seats });
      } else {
        // declined or cancelled: refund anything already paid, and free the seats if they were held
        if (payment_status === 'paid' && stripe) {
          let intent = booking.stripe_payment_intent;
          if (!intent && booking.stripe_session_id) intent = (await stripe.checkout.sessions.retrieve(booking.stripe_session_id)).payment_intent;
          await stripe.refunds.create({ payment_intent: intent });
          payment_status = 'refunded';
        }
        if (booking.status === 'confirmed') {
          const ride = await db.PoolRide.get(booking.ride_id);
          await db.PoolRide.update(ride.id, { seats_available: ride.seats_available + booking.seats });
        }
      }
      const updated = await db.PoolBooking.update(booking.id, { status, payment_status });
      return Response.json({ booking: updated });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}