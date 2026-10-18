import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useTripReviewPrompt(reviews, userId, onCompleted) {
  const [review, setReview] = useState(null);
  const prompted = useRef(new Set());
  const refresh = useRef(onCompleted);
  useEffect(() => { refresh.current = onCompleted; }, [onCompleted]);
  const openReview = (booking, ride) => {
    const isDriver = String(ride.driver_id) === String(userId);
    const targetId = isDriver ? booking.passenger_id : ride.driver_id;
    const key = `${ride.id}:${targetId}`;
    prompted.current.add(key);
    setReview({ key, ride, targetId, tripRole: isDriver ? 'passenger' : 'driver',
      username: isDriver ? (booking.passenger_username || booking.passenger_name) : (booking.driver_username || ride.driver_name),
    });
  };
  useEffect(() => {
    if (!userId || review) return;
    const next = reviews.find(({ booking, ride }) => {
      const targetId = String(ride.driver_id) === String(userId) ? booking.passenger_id : ride.driver_id;
      return !prompted.current.has(`${ride.id}:${targetId}`);
    });
    if (next) openReview(next.booking, next.ride);
  }, [reviews, userId, review]);
  useEffect(() => {
    if (!userId) return;
    const unsubscribeRide = base44.entities.Ride.subscribe(event => {
      if (event.type === 'update' && event.data?.status === 'completed') refresh.current();
    });
    const unsubscribeBooking = base44.entities.RideBooking.subscribe(event => {
      const booking = event.data;
      if (event.type === 'update' && booking?.booking_status === 'completed'
        && (String(booking.driver_id) === String(userId) || String(booking.passenger_id) === String(userId))) refresh.current();
    });
    return () => { unsubscribeRide(); unsubscribeBooking(); };
  }, [userId]);
  return { review, openReview, closeReview: () => setReview(null) };
}