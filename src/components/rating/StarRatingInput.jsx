import React from 'react';
import { Star } from 'lucide-react';

export default function StarRatingInput({ value, onChange, disabled }) {
  return (
    <div role="group" aria-label="Trip rating" className="flex justify-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button" aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
          aria-pressed={value === star} disabled={disabled} onClick={() => onChange(star)}
          className="flex h-12 w-12 items-center justify-center rounded-lg select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
          <Star aria-hidden="true" className={`h-10 w-10 ${star <= value ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
        </button>
      ))}
    </div>
  );
}