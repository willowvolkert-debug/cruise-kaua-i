import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, User, Calendar, Car } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

export default function DriverProfileModal({ isOpen, onClose, ride, onBookRide, currentUser, driverRatings = [] }) {

  const averageRating = driverRatings.length > 0 
    ? (driverRatings.reduce((sum, r) => sum + r.rating_value, 0) / driverRatings.length).toFixed(1)
    : 0;

  const handleBookRide = () => {
    onClose();
    onBookRide(ride);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg !bg-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary">Driver Profile</DialogTitle>
        </DialogHeader>

        {!ride ? (
          <div className="p-8 text-center">Loading driver information...</div>
        ) : (
          <div className="space-y-4">
            {/* Scrollable Driver Info Section */}
            <div className="max-h-64 overflow-y-auto space-y-6 pr-2">
              {/* Driver Info */}
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={ride?.driver_profile_picture_url} />
                  <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white font-bold text-2xl">
                    {getInitials(ride?.driver_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-secondary">@{ride?.driver_username || ride?.driver_name}</h3>
                  {ride?.driver_age && ride?.driver_gender && (
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>{ride.driver_gender}, {ride.driver_age} years old</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ratings */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="text-lg font-semibold">{averageRating || 'New'}</span>
                  <span className="text-gray-500">({driverRatings?.length || 0} reviews)</span>
                </div>
              </div>

              {/* Bio */}
              {ride?.driver_bio && (
                <div>
                  <h4 className="font-semibold text-secondary mb-2">About</h4>
                  <p className="text-gray-700">{ride.driver_bio}</p>
                </div>
              )}

              {/* Preferences */}
              {(ride?.driver_preferences_chattiness || ride?.driver_preferences_scents) && (
                <div className="space-y-2">
                  {ride?.driver_preferences_chattiness && (
                    <div className="text-sm">
                      <span className="text-gray-600">Chattiness:</span>
                      <span className="ml-2 font-medium">{ride.driver_preferences_chattiness}</span>
                    </div>
                  )}
                  {ride?.driver_preferences_scents && (
                    <div className="text-sm">
                      <span className="text-gray-600">Scents:</span>
                      <span className="ml-2 font-medium">{ride.driver_preferences_scents}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Vehicle Photos */}
              {(ride?.driver_vehicle_exterior_photo_url || ride?.driver_vehicle_interior_photo_urls?.length > 0) && (
                <div>
                  <h4 className="font-semibold text-secondary mb-3">Vehicle Photos</h4>
                  <div className="space-y-3">
                    {ride?.driver_vehicle_exterior_photo_url && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Exterior</p>
                        <img 
                          src={ride.driver_vehicle_exterior_photo_url} 
                          alt="Vehicle exterior" 
                          className="w-full rounded-2xl border border-gray-200 object-cover max-h-64"
                        />
                      </div>
                    )}
                    {ride?.driver_vehicle_interior_photo_urls?.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Interior</p>
                        <div className="grid grid-cols-2 gap-2">
                          {ride.driver_vehicle_interior_photo_urls.map((url, idx) => (
                            <img 
                              key={idx}
                              src={url} 
                              alt={`Vehicle interior ${idx + 1}`} 
                              className="w-full rounded-2xl border border-gray-200 object-cover h-32"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ride Details */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-200">
                <h4 className="font-semibold text-secondary">Trip Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">From:</span>
                    <span className="font-medium">{ride?.departure_location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To:</span>
                    <span className="font-medium">{ride?.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date & Time:</span>
                    <span className="font-medium">
                      {format(new Date(ride?.departure_date), "MMM d, yyyy")} at {ride?.departure_time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per seat:</span>
                    <span className="font-medium">${currentUser?.has_hawaii_id ? (ride?.price_per_seat_local || 0) : (ride?.price_per_seat_tourist || 0)}</span>
                  </div>
                  {ride?.car_model && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle:</span>
                      <span className="font-medium">{ride.car_model}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Reviews */}
              {driverRatings && driverRatings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-secondary mb-3">Recent Reviews</h4>
                  <div className="space-y-3">
                    {driverRatings.slice(0, 3).map(rating => (
                      <div key={rating.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          {Array(rating.rating_value).fill(0).map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                          ))}
                          <span className="text-xs text-gray-500">
                            {format(new Date(rating.created_date), "MMM yyyy")}
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

            {/* Book Button - Outside scrollable area */}
            <div className="flex justify-center pt-4 border-t border-gray-200">
              <Button
                onClick={handleBookRide}
                className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl"
              >
                Book This Ride
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}