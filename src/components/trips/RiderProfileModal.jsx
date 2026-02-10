import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

export default function RiderProfileModal({ isOpen, onClose, request, riderRatings = [] }) {
  const averageRating = riderRatings.length > 0 
    ? (riderRatings.reduce((sum, r) => sum + r.rating_value, 0) / riderRatings.length).toFixed(1)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg !bg-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary">Rider Profile</DialogTitle>
        </DialogHeader>

        {!request ? (
          <div className="p-8 text-center">Loading rider information...</div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-6 pr-2">
              {/* Rider Info */}
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={request.rider_profile_picture_url} />
                  <AvatarFallback className="bg-gradient-to-r from-primary to-green-400 text-white font-bold text-2xl">
                    {getInitials(request.rider_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-secondary">@{request.rider_username || request.rider_name}</h3>
                  {request.rider_age && request.rider_gender && (
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>{request.rider_gender}, {request.rider_age} years old</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ratings */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="text-lg font-semibold">{averageRating || 'New'}</span>
                  <span className="text-gray-500">({riderRatings?.length || 0} reviews)</span>
                </div>
              </div>

              {/* Bio */}
              {request.rider_bio && (
                <div>
                  <h4 className="font-semibold text-secondary mb-2">About</h4>
                  <p className="text-gray-700">{request.rider_bio}</p>
                </div>
              )}

              {/* Request Details */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-200">
                <h4 className="font-semibold text-secondary">Ride Request Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">From:</span>
                    <span className="font-medium">{request.departure_location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To:</span>
                    <span className="font-medium">{request.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date & Time:</span>
                    <span className="font-medium">
                      {request.departure_date ? (() => {
                        const dateStr = request.departure_date;
                        const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00');
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      })() : 'Date not set'} at {request.departure_time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seats needed:</span>
                    <span className="font-medium">{request.seats_needed}</span>
                  </div>
                  {request.has_luggage && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Luggage:</span>
                      <span className="font-medium">Yes</span>
                    </div>
                  )}
                  {request.description && (
                    <div className="pt-2">
                      <span className="text-gray-600 block mb-1">Reason:</span>
                      <p className="text-gray-700 italic">"{request.description}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Reviews */}
              {riderRatings && riderRatings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-secondary mb-3">Recent Reviews</h4>
                  <div className="space-y-3">
                    {riderRatings.slice(0, 3).map(rating => (
                      <div key={rating.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          {Array(rating.rating_value).fill(0).map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                          ))}
                          <span className="text-xs text-gray-500">
                            {new Date(rating.created_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        {rating.comment && (
                          <p className="text-sm text-gray-700 italic">"{rating.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}