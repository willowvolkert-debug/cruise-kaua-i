import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, DollarSign, Users, Car, Wind, MessageCircle, Sparkles, Navigation, Star, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

export default function RideCard({ ride, onBookRide, showBookButton = true, currentUser, driverProfile, driverRatings = [] }) {
  const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const isLocal = currentUser?.driver_license_state === 'HI';
  const displayPrice = isLocal ? (ride.price_per_seat_local || 0) : (ride.price_per_seat_tourist || 0);
  
  const averageRating = driverRatings.length > 0 
    ? (driverRatings.reduce((sum, r) => sum + r.rating_value, 0) / driverRatings.length).toFixed(1)
    : null;
  
  return (
    <Card className={`hover:shadow-xl transition-all duration-300 shadow-lg bg-white flex flex-col ${ride.is_last_minute ? 'border-red-400 border-2' : 'border-border'}`}>
      {ride.is_last_minute && (
        <div className="bg-red-500 text-white px-4 py-2 text-sm font-semibold">
          last minute: {ride.departure_time}
        </div>
      )}
      <CardHeader className="p-6">
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                        <p className="font-semibold text-secondary">{ride.departure_location}</p>
                        <div className="w-6 border-t border-dashed border-gray-300 my-1"></div>
                        <p className="font-semibold text-secondary">{ride.destination}</p>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <p className="text-2xl font-bold text-secondary">
                  {displayPrice === 0 ? 'Free' : `$${displayPrice}`}
                </p>
                <p className="text-sm text-gray-500">per seat</p>
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-0 flex-grow flex flex-col justify-between">
        <div>
            <div className="flex flex-col gap-1 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>{format(new Date(ride.departure_date), "MMM d, yyyy")} at {ride.departure_time}</span></div>
                {ride.is_flexible && <span className="text-amber-600 text-xs ml-6">flexible timing</span>}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="border-primary/50 text-primary"><Users className="w-3 h-3 mr-1" />{ride.seats_available} seats left</Badge>
                {ride.offers_detour_service && <Badge variant="outline" className="border-green-500/50 text-green-600"><Navigation className="w-3 h-3 mr-1" />Detours +$5</Badge>}
                {ride.offers_midpoint_pickup && <Badge variant="outline" className="border-blue-500/50 text-blue-600"><ArrowUpDown className="w-3 h-3 mr-1" />pickup/dropoff along the way available</Badge>}
            </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 bg-gradient-to-r from-primary to-secondary">
              <AvatarImage src={driverProfile?.profile_picture_url} />
              <AvatarFallback className="text-white font-semibold">{getInitials(ride.driver_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-secondary">{ride.driver_name}</p>
              {averageRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm text-gray-600">{averageRating} ({driverRatings.length})</span>
                </div>
              )}
            </div>
          </div>
          
          {showBookButton && ride.status === 'active' && (
            <Button size="sm" onClick={() => onBookRide(ride)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Book Ride
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}