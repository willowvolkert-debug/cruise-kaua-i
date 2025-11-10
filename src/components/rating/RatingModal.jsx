import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

export default function RatingModal({ isOpen, onClose, ride, ratingType, onSubmitRating }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return; // Must provide rating
    
    setIsSubmitting(true);
    await onSubmitRating({
      rating_value: rating,
      comment: comment.trim(),
      trip_role: ratingType
    });
    setIsSubmitting(false);
    
    // Reset form
    setRating(0);
    setComment("");
    onClose();
  };

  const targetName = ratingType === 'driver' ? ride?.driver_name : 'Passenger';

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} // Prevent closing until rating is submitted
      className="z-50"
    >
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary text-center">
            Rate Your {ratingType === 'driver' ? 'Driver' : 'Ride'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Person being rated */}
          <div className="flex items-center justify-center gap-3">
            <Avatar className="w-16 h-16 bg-gradient-to-r from-primary to-secondary">
              <AvatarFallback className="text-white font-bold text-xl">
                {getInitials(targetName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-secondary text-lg">{targetName}</p>
              <p className="text-gray-500">
                {ride?.departure_location} → {ride?.destination}
              </p>
            </div>
          </div>

          {/* Star Rating */}
          <div className="flex justify-center">
            <div className="flex gap-2">
              {Array(5).fill(0).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  onMouseEnter={() => setHoveredStar(i + 1)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star 
                    className={`w-10 h-10 ${
                      (hoveredStar || rating) > i 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {rating > 0 && (
            <div className="text-center">
              <p className="font-medium text-secondary">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            </div>
          )}

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Additional Comments (Optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="h-20"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}