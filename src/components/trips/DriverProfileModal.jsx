import React, { useState, useEffect } from "react";
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

export default function DriverProfileModal({ isOpen, onClose, ride, onBookRide, currentUser }) {
  const [driverProfile, setDriverProfile] = useState(null);
  const [driverRatings, setDriverRatings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDriverData = async () => {
      if (!isOpen || !ride) return;
      
      setIsLoading(true);
      try {
        // Get driver profile
        const allUsers = await base44.entities.User.list();
        const driver = allUsers.find(u => u.id === ride.driver_id);
        setDriverProfile(driver);

        // Get driver ratings
        const allRatings = await base44.entities.Rating.list();
        const ratings = allRatings.filter(r => 
          r.rated_user_id === ride.driver_id && r.trip_role === 'driver'
        );
        setDriverRatings(ratings);
      } catch (error) {
        console.error("Error loading driver data:", error);
      }
      setIsLoading(false);
    };

    loadDriverData();
  }, [isOpen, ride]);

  const averageRating = driverRatings.length > 0 
    ? (driverRatings.reduce((sum, r) => sum + r.rating_value, 0) / driverRatings.length).toFixed(1)
    : 0;

  const handleBookRide = () => {
    onClose();
    onBookRide(ride);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary">Driver Profile</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-8 text-center">Loading driver information...</div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Driver Info */}
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={driverProfile?.profile_picture_url} />
                <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white font-bold text-2xl">
                  {getInitials(ride.driver_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-secondary">{ride.driver_name}</h3>
                {driverProfile && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>{driverProfile.gender}, {driverProfile.age} years old</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {format(new Date(driverProfile.created_date), "MMM yyyy")}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ratings */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-lg font-semibold">{averageRating}</span>
                <span className="text-gray-500">({driverRatings.length} reviews)</span>
              </div>
            </div>

            {/* Bio */}
            {driverProfile?.bio && (
              <div>
                <h4 className="font-semibold text-secondary mb-2">About</h4>
                <p className="text-gray-700">{driverProfile.bio}</p>
              </div>
            )}

            {/* Ride Details */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-200">
              <h4 className="font-semibold text-secondary">Trip Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">From:</span>
                  <span className="font-medium">{ride.departure_location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To:</span>
                  <span className="font-medium">{ride.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-medium">
                    {format(new Date(ride.departure_date), "MMM d, yyyy")} at {ride.departure_time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per seat:</span>
                  <span className="font-medium">${currentUser?.has_hawaii_id ? (ride.price_per_seat_local || 0) : (ride.price_per_seat_tourist || 0)}</span>
                </div>
                {ride.car_model && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle:</span>
                    <span className="font-medium">{ride.car_model}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Reviews */}
            {driverRatings.length > 0 && (
              <div>
                <h4 className="font-semibold text-secondary mb-3">Recent Reviews</h4>
                <div className="space-y-3 max-h-32 overflow-y-auto">
                  {driverRatings.slice(0, 3).map(rating => (
                    <div key={rating.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        {Array(rating.rating_value).fill(0).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
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

            {/* Book Button */}
            <div className="flex justify-center pt-4">
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