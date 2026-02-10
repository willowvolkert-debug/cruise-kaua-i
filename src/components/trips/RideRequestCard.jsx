import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, Users, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

export default function RideRequestCard({ request, onMessage }) {
  return (
    <Card className="border-gray-200 hover:border-primary/50 transition-all rounded-3xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="w-12 h-12">
              <AvatarImage src={request.rider_profile_picture_url} />
              <AvatarFallback className="bg-gradient-to-r from-primary to-green-400 text-white font-semibold">
                {getInitials(request.rider_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-secondary">{request.rider_name}</span>
                {request.rider_username && (
                  <span className="text-sm text-gray-500">@{request.rider_username}</span>
                )}
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{request.departure_location} → {request.destination}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{request.departure_date ? new Date(request.departure_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Date not set'}</span>
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
          
          <Button
            onClick={() => onMessage(request)}
            size="icon"
            className="bg-primary hover:bg-primary/90 rounded-2xl shrink-0"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}