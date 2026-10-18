import { base44 } from '@/api/base44Client';
import { parseTimeString } from '@/lib/hstHelpers';

export default async function getPendingTripReviews(bookings, rides, userId) {
  const rideById = new Map(rides.map(ride => [String(ride.id), ride]));
  const candidates = [];
  for (const booking of bookings) {
    if (!['confirmed', 'completed'].includes(booking.booking_status)) continue;
    if (String(booking.driver_id) !== String(userId) && String(booking.passenger_id) !== String(userId)) continue;
    if (booking.payment_status !== 'paid' && booking.total_amount !== 0) continue;
    const ride = rideById.get(String(booking.ride_id));
    if (!ride || ride.status === 'cancelled') continue;
    const { hours, minutes } = parseTimeString(ride.departure_time);
    const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const reviewAfter = new Date(`${ride.departure_date}T${time}:00-10:00`).getTime() + 4 * 60 * 60 * 1000;
    if (ride.status !== 'completed' && booking.booking_status !== 'completed' && Date.now() <= reviewAfter) continue;
    if (ride.status !== 'completed' && booking.booking_status !== 'completed' && !Number.isFinite(reviewAfter)) continue;
    const targetId = String(ride.driver_id) === String(userId) ? booking.passenger_id : ride.driver_id;
    candidates.push({ booking, ride, targetId });
  }
  const results = await Promise.all(candidates.map(async ({ booking, ride, targetId }) => {
    const existing = await base44.entities.Rating.count({
      ride_id: ride.id, rated_by_user_id: userId, rated_user_id: targetId,
    });
    return existing === 0 ? [{ booking, ride }] : [];
  }));
  return results.flat();
}