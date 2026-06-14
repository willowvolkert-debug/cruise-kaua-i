import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, Users, MessageCircle, Car } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

export default function RideRequestCard({ request, onMessage, onViewProfile, onRespondWithRide }) {
  const riderDisplayName = request.rider_name || request.rider_username || 'Cruise member';
  return (
    <Card className="border-gray-200 hover:border-primary/50 transition-all rounded-3xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={() => onViewProfile && onViewProfile(request)}
              className="hover:opacity-80 transition-opacity"
            >
              <Avatar className="w-12 h-12 cursor-pointer">
                <AvatarImage src={request.rider_profile_picture_url} />
                <AvatarFallback className="bg-gradient-to-r from-primary to-green-400 text-white font-semibold">
                  {getInitials(riderDisplayName)}
                </AvatarFallback>
              </Avatar>
            </button>
            
            <div className="flex-1 space-y-2">
              <button
                onClick={() => onViewProfile && onViewProfile(request)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
              >
                <span className="font-semibold text-secondary">{riderDisplayName}</span>
                {request.rider_username && (
                  <span className="text-sm text-gray-500">@{request.rider_username}</span>
                )}
              </button>
              
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{request.departure_location} → {request.destination}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{request.departure_date ? (() => {
                    const dateStr = request.departure_date;
                    // Handle ISO format with time vs simple date format
                    const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00');
                    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                  })() : 'Date not set'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{request.departure_time}</span>
                  {request.is_flexible && <span className="text-xs text-orange-600">(flexible)</span>}
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{request.seats_needed} seat{request.seats_needed > 1 ? 's' : ''}</span>
                </div>

                {request.description && (
                  <p className="text-gray-600 mt-2 italic">&quot;{request.description}&quot;</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              onClick={() => onMessage(request)}
              size="icon"
              className="bg-primary hover:bg-primary/90 rounded-2xl"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
            {onRespondWithRide && (
              <Button
                onClick={() => onRespondWithRide(request)}
                size="icon"
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary/10 rounded-2xl"
                title="Post a ride for this request"
              >
                <Car className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}