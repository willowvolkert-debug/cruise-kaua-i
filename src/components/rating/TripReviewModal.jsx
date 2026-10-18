import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import StarRatingInput from '@/components/rating/StarRatingInput';

export default function TripReviewModal({ review, userId, onClose, onSaved }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  useEffect(() => { setRating(0); setComment(''); setError(''); }, [review?.key]);
  const submit = async event => {
    event.preventDefault();
    if (!rating || !review || submitting.current) return;
    submitting.current = true;
    setSaving(true); setError('');
    try {
      const target = { ride_id: review.ride.id, rated_by_user_id: userId, rated_user_id: review.targetId };
      const existing = await base44.entities.Rating.count(target);
      if (existing === 0) await base44.entities.Rating.create({ ...target, rating_value: rating, comment: comment.trim(), trip_role: review.tripRole });
      toast({ title: existing ? 'review already submitted' : 'review submitted', description: 'Thank you for helping our community ride with confidence.' });
      onClose();
      onSaved();
    } catch {
      setError('Your review could not be saved. Your stars and comment are still here. Please try again.');
    } finally {
      submitting.current = false; setSaving(false);
    }
  };
  if (!review) return null;
  return (
    <Dialog open={true} onOpenChange={open => { if (!open && !submitting.current) onClose(); }}>
      <DialogContent className="sm:max-w-md rounded-3xl bg-card text-card-foreground max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary">how was your trip with @{review.username}?</DialogTitle>
          <p className="text-sm text-muted-foreground">{review.ride.departure_location} → {review.ride.destination}</p>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5 py-4">
          <StarRatingInput value={rating} onChange={setRating} disabled={saving} />
          <Textarea aria-label="Comments about your trip (optional)" value={comment} onChange={event => setComment(event.target.value)} disabled={saving} placeholder="Share your experience (optional)..." className="h-32 rounded-2xl" />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={!rating || saving} className="w-full rounded-2xl select-none">{saving ? 'submitting review...' : 'submit review'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}