import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, Wind, MessageCircle, Loader2, DollarSign, RefreshCw, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { sendBookingEmail } from "@/functions/sendBookingEmail";
import { format } from "date-fns";


const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

export default function RiderRequestModal({ isOpen, onClose, booking, onAccept, onReject, onRequestFullPrice }) {
  const [riderProfile, setRiderProfile] = useState(null);
  const [riderRatings, setRiderRatings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBgCheckBlock, setShowBgCheckBlock] = useState(false);
  const [currentDriverUsername, setCurrentDriverUsername] = useState(null);

  useEffect(() => {
    const loadRiderData = async () => {
      if (!isOpen || !booking) return;
      
      setIsLoading(true);
      try {
        // Load current driver username for background check restriction
        const me = await base44.auth.me();
        setCurrentDriverUsername(me?.username || null);

        // Fetch full user profile to get pic, age, etc.
        const allUsers = await base44.asServiceRole.entities.User.list();
        const rider = allUsers.find(u => u.id === booking.passenger_id);
        setRiderProfile({
          profile_picture_url: rider?.profile_picture_url || booking.passenger_profile_picture_url || null,
          bio: rider?.bio || booking.passenger_bio || null,
          gender: rider?.gender || booking.passenger_gender || null,
          age: rider?.age || booking.passenger_age || null,
          preferences_chattiness: rider?.preferences_chattiness || booking.passenger_preferences_chattiness || null,
          preferences_scents: rider?.preferences_scents || booking.passenger_preferences_scents || null,
        });

        const allRatings = await base44.entities.Rating.list();
        const ratings = allRatings.filter(r => 
          r.rated_user_id === booking.passenger_id && r.trip_role === 'passenger'
        );
        setRiderRatings(ratings);
      } catch (error) {
        console.error("Error loading rider data:", error);
      }
      setIsLoading(false);
    };

    loadRiderData();
  }, [isOpen, booking]);

  const averageRating = riderRatings.length > 0 
    ? (riderRatings.reduce((sum, r) => sum + r.rating_value, 0) / riderRatings.length).toFixed(1)
    : 0;

  const handleAccept = async () => {
    if (currentDriverUsername === '247pono') {
      setShowBgCheckBlock(true);
      return;
    }
    setIsProcessing(true);
    await onAccept(booking);
    setIsProcessing(false);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await onReject(booking);
    setIsProcessing(false);
  };

  const handleRequestFullPrice = async () => {
    setIsProcessing(true);
    if (onRequestFullPrice) await onRequestFullPrice(booking);
    setIsProcessing(false);
  };

  if (!booking) return null;

  return (
    <>
    {/* Background check block popup */}
    <Dialog open={showBgCheckBlock} onOpenChange={setShowBgCheckBlock}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Background Check Issue
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-gray-700">
            There is an issue with your background check. Please contact admin through the{" "}
            <a href="/contactus" className="text-primary underline font-semibold">Contact Us form</a>{" "}
            to accept this ride.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowBgCheckBlock(false)}
            variant="outline"
            className="flex-1 rounded-2xl"
          >
            Close
          </Button>
          <Button
            onClick={() => { setShowBgCheckBlock(false); window.location.href = '/contactus'; }}
            className="flex-1 bg-primary hover:bg-primary/90 rounded-2xl"
          >
            Contact Admin
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary text-center">
            a rider has requested a seat in your car!
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-8 text-center">Loading rider information...</div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Why traveling */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-secondary mb-2">Why they're traveling:</p>
              <p className="text-gray-700 italic">"{booking.description}"</p>
            </div>

            {/* Rider Info */}
            <div className="flex items-center gap-4">
              <Avatar className="w-24 h-24 bg-gradient-to-r from-primary to-secondary">
                <AvatarImage src={riderProfile?.profile_picture_url} />
                <AvatarFallback className="text-white font-bold text-2xl">
                  {getInitials(booking.passenger_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-secondary">{booking.passenger_name}</h3>
                {riderProfile && (
                  <div className="space-y-1 mt-2">
                    <div className="text-sm text-gray-600">
                      <span>{riderProfile.gender}, {riderProfile.age} years old</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold">{averageRating}</span>
                      <span className="text-sm text-gray-500">({riderRatings.length} reviews)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {riderProfile?.bio && (
              <div>
                <h4 className="font-semibold text-secondary mb-2">About</h4>
                <p className="text-gray-700">{riderProfile.bio}</p>
              </div>
            )}

            {/* Preferences */}
            {riderProfile && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <h4 className="font-semibold text-secondary mb-3">Preferences</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <MessageCircle className="w-4 h-4" />
                      chattiness
                    </span>
                    <Badge variant="outline">{riderProfile.preferences_chattiness}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <Wind className="w-4 h-4" />
                      scents
                    </span>
                    <Badge variant="outline">{riderProfile.preferences_scents}</Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Price Offer Banner */}
            {booking.is_price_offer && booking.offered_price && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-2">
                <p className="text-sm font-bold text-amber-800 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  this rider submitted a price offer
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-amber-700">their offer: <strong className="text-lg text-amber-900">${booking.offered_price}/seat</strong></span>
                  <span className="text-gray-400">·</span>
                  <span className="text-amber-700">total paid: <strong>${booking.total_amount?.toFixed(2)}</strong></span>
                </div>
              </div>
            )}

            {/* Booking Details */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-200">
              <h4 className="font-semibold text-secondary">Request Details</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Seats requested:</span>
                <span className="font-medium">{booking.seats_booked}</span>
              </div>
              {booking.is_partial_ride && booking.partial_from && booking.partial_to && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs font-semibold text-blue-700 mb-1">⚠️ Partial ride request</p>
                  <p className="text-sm text-blue-800">
                    This rider only wants a <strong>section</strong> of your route:<br />
                    <strong>{booking.partial_from}</strong> → <strong>{booking.partial_to}</strong>
                  </p>
                  <p className="text-sm text-blue-700 mt-1">They would pay: <strong>${booking.total_amount?.toFixed(2)}</strong></p>
                </div>
              )}
              {!booking.is_partial_ride && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total payment:</span>
                  <span className="font-medium">${booking.total_amount?.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Recent Reviews */}
            {riderRatings.length > 0 && (
              <div>
                <h4 className="font-semibold text-secondary mb-3">Recent Reviews</h4>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {riderRatings.slice(0, 5).map(rating => (
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

            {/* Action Buttons */}
            {booking.is_price_offer && booking.offered_price ? (
              <div className="space-y-2 pt-4">
                <Button
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700 rounded-2xl"
                >
                  <Check className="w-4 h-4 mr-2" />
                  accept rider's offer (${booking.offered_price}/seat)
                </Button>
                <Button
                  onClick={handleRequestFullPrice}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full border-amber-400 text-amber-700 hover:bg-amber-50 rounded-2xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  request original price request
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50 rounded-2xl"
                >
                  <X className="w-4 h-4 mr-2" />
                  deny request
                </Button>
              </div>
            ) : (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleReject}
                  disabled={isProcessing}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 rounded-2xl"
                >
                  <X className="w-4 h-4 mr-2" />
                  reject request
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-2xl"
                >
                  <Check className="w-4 h-4 mr-2" />
                  accept request
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}