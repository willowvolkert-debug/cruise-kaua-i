import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Calendar, Clock, ChevronRight, ChevronDown, MessageSquare, Star } from "lucide-react";
import { format } from "date-fns";
import ChatModal from "../components/inbox/ChatModal";
import RiderCancelModal from "../components/inbox/RiderCancelModal";
import DriverRideModal from "../components/inbox/DriverRideModal";
import { sendBookingEmail } from "../functions/sendBookingEmail";

const formatTime12Hour = (timeStr) => {
    if (!timeStr) return '';
    if (/AM|PM/i.test(timeStr)) return timeStr;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const getHawaiiNow = () => {
    const now = new Date();
    const hawaiiTime = new Date(now.getTime() - (10 * 60 * 60 * 1000));
    return {
        year: hawaiiTime.getUTCFullYear(),
        month: hawaiiTime.getUTCMonth() + 1,
        day: hawaiiTime.getUTCDate(),
        hour: hawaiiTime.getUTCHours(),
        minute: hawaiiTime.getUTCMinutes(),
        toComparable: function() {
            return this.year * 100000000 + this.month * 1000000 + this.day * 10000 + this.hour * 100 + this.minute;
        }
    };
};

const parseTimeString = (timeStr) => {
    if (!timeStr) return { hours: 23, minutes: 59 };
    const normalized = timeStr.toLowerCase().trim();
    if (normalized.includes(':')) {
        const [h, m] = normalized.replace(/[ap]m/i, '').split(':').map(Number);
        let hours = h;
        if (normalized.includes('pm') && hours < 12) hours += 12;
        if (normalized.includes('am') && hours === 12) hours = 0;
        return { hours, minutes: m || 0 };
    }
    const match = normalized.match(/^(\d{1,4})(am|pm)?$/);
    if (match) {
        const numPart = match[1];
        const period = match[2];
        let hours, minutes;
        if (numPart.length <= 2) { hours = parseInt(numPart); minutes = 0; }
        else if (numPart.length === 3) { hours = parseInt(numPart[0]); minutes = parseInt(numPart.substring(1)); }
        else { hours = parseInt(numPart.substring(0, 2)); minutes = parseInt(numPart.substring(2)); }
        if (period === 'pm' && hours < 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        return { hours, minutes };
    }
    return { hours: 23, minutes: 59 };
};

const parseRideDateTimeHST = (dateStr, timeStr) => {
    if (!dateStr) return { toComparable: () => 0, addHours: (h) => ({ toComparable: () => 0 }) };
    const [year, month, day] = dateStr.split('-').map(Number);
    const { hours, minutes } = parseTimeString(timeStr);
    const addHours = function(h) {
        let newHour = hours + h;
        let newDay = day;
        let newMonth = month;
        let newYear = year;
        while (newHour >= 24) { newHour -= 24; newDay++; }
        return { year: newYear, month: newMonth, day: newDay, hour: newHour, minute: minutes,
            toComparable: function() { return this.year * 100000000 + this.month * 1000000 + this.day * 10000 + this.hour * 100 + this.minute; }
        };
    };
    return {
        year, month, day, hour: hours, minute: minutes,
        toComparable: function() { return this.year * 100000000 + this.month * 1000000 + this.day * 10000 + this.hour * 100 + this.minute; },
        addHours
    };
};

export default function ConfirmedRidesPage() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [upcomingRides, setUpcomingRides] = useState([]);
    const [pastRides, setPastRides] = useState([]);
    const [showPastRides, setShowPastRides] = useState(false);
    const [activeBookings, setActiveBookings] = useState([]);
    const [allRidesData, setAllRidesData] = useState([]);
    const [ridesNeedingReview, setRidesNeedingReview] = useState([]);
    const [showChatModal, setShowChatModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedChatName, setSelectedChatName] = useState('');
    const [selectedChatPicture, setSelectedChatPicture] = useState('');
    const [showRiderCancelModal, setShowRiderCancelModal] = useState(false);
    const [riderBookingToCancel, setRiderBookingToCancel] = useState(null);
    const [showDriverRideModal, setShowDriverRideModal] = useState(false);
    const [selectedDriverRide, setSelectedDriverRide] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewData, setReviewData] = useState({ rating: 0, comment: '' });
    const [currentReviewUser, setCurrentReviewUser] = useState(null);
    const [currentReviewRide, setCurrentReviewRide] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            const [allRides, allBookings, allRatings] = await Promise.all([
                base44.entities.Ride.list(),
                base44.entities.RideBooking.list(),
                base44.entities.Rating.list()
            ]);
            setAllRidesData(allRides);

            const confirmedBookings = allBookings.filter(b => {
                const isPassenger = String(b.passenger_id) === String(currentUser.id);
                const isDriver = String(b.driver_id) === String(currentUser.id);
                const isConfirmed = b.booking_status === 'confirmed';
                const isPaid = b.payment_status === 'paid';
                const isRideRequestReply = isConfirmed && b.total_amount === 0 && b.ride_id?.startsWith('ride-request-');
                return (isPassenger || isDriver) && isConfirmed && (isPaid || isRideRequestReply);
            });
            setActiveBookings(confirmedBookings);

            const hawaiiNow = getHawaiiNow();
            const nowComparable = hawaiiNow.toComparable();

            // Split into needs-review vs still active
            const needsReview = [];
            const stillActive = [];
            for (const booking of confirmedBookings) {
                const ride = allRides.find(r => String(r.id) === String(booking.ride_id));
                if (ride) {
                    const rideDateTime = parseRideDateTimeHST(ride.departure_date, ride.departure_time);
                    const reviewThreshold = rideDateTime.addHours(4);
                    if (nowComparable > reviewThreshold.toComparable()) {
                        const isDriver = String(ride.driver_id) === String(currentUser.id);
                        const otherUserId = isDriver ? booking.passenger_id : ride.driver_id;
                        const userRating = allRatings.find(r =>
                            String(r.ride_id) === String(ride.id) &&
                            String(r.rated_by_user_id) === String(currentUser.id) &&
                            String(r.rated_user_id) === String(otherUserId)
                        );
                        if (!userRating) needsReview.push({ booking, ride });
                    } else {
                        stillActive.push(booking);
                    }
                } else {
                    stillActive.push(booking);
                }
            }
            setRidesNeedingReview(needsReview);

            // Upcoming rides (driver)
            const myUpcomingRides = allRides.filter(r => {
                if (String(r.driver_id) !== String(currentUser.id)) return false;
                if (r.status !== 'active' && r.status !== 'full') return false;
                const rideDateTime = parseRideDateTimeHST(r.departure_date, r.departure_time);
                return rideDateTime.toComparable() > nowComparable;
            });

            // Upcoming rides (passenger)
            const myBookedRides = stillActive
                .filter(b => String(b.passenger_id) === String(currentUser.id))
                .map(b => allRides.find(r => r.id === b.ride_id))
                .filter(ride => {
                    if (!ride) return false;
                    const rideDateTime = parseRideDateTimeHST(ride.departure_date, ride.departure_time);
                    return rideDateTime.toComparable() > nowComparable;
                });

            const uniqueUpcoming = Array.from(new Set([...myUpcomingRides, ...myBookedRides].map(r => r.id)))
                .map(id => [...myUpcomingRides, ...myBookedRides].find(r => r.id === id))
                .sort((a, b) => {
                    const aComp = parseRideDateTimeHST(a.departure_date, a.departure_time).toComparable();
                    const bComp = parseRideDateTimeHST(b.departure_date, b.departure_time).toComparable();
                    return aComp - bComp;
                });
            setUpcomingRides(uniqueUpcoming);

            // Past rides (driver or passenger, departed already)
            const myPastRides = allRides.filter(r => {
                const isDriver = String(r.driver_id) === String(currentUser.id);
                const isPassenger = confirmedBookings.some(b => String(b.passenger_id) === String(currentUser.id) && String(b.ride_id) === String(r.id));
                if (!isDriver && !isPassenger) return false;
                const rideDateTime = parseRideDateTimeHST(r.departure_date, r.departure_time);
                return rideDateTime.toComparable() <= nowComparable;
            }).sort((a, b) =>
                parseRideDateTimeHST(b.departure_date, b.departure_time).toComparable() -
                parseRideDateTimeHST(a.departure_date, a.departure_time).toComparable()
            );
            setPastRides(myPastRides);

        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    };

    const handleOpenChat = (booking, otherPartyName, otherPartyPicture) => {
        setSelectedBooking(booking);
        setSelectedChatName(otherPartyName);
        setSelectedChatPicture(otherPartyPicture || '');
        setShowChatModal(true);
    };

    const handleConfirmRiderCancel = async (booking, reason, refundPercentage) => {
        try {
            const ride = allRidesData.find(r => r.id === booking.ride_id);
            await base44.entities.RideBooking.update(booking.id, {
                booking_status: 'cancelled',
                cancellation_reason: reason,
                cancellation_date: new Date().toISOString()
            });
            if (ride) {
                await base44.entities.Ride.update(ride.id, {
                    seats_available: ride.seats_available + booking.seats_booked,
                    status: 'active'
                });
            }
            await base44.entities.AdminMessage.create({
                recipient_id: 'admin', recipient_name: 'Admin',
                subject: `Refund Request: ${refundPercentage} - ${booking.passenger_name}`,
                message: `RIDER CANCELLATION\nPassenger: ${booking.passenger_name}\nBooking ID: ${booking.id}\nRide: ${ride?.departure_location} → ${ride?.destination}\nDate: ${ride?.departure_date}\nTotal Paid: $${booking.total_amount?.toFixed(2)}\nRefund: ${refundPercentage}\nReason: ${reason}`,
                message_type: 'action_required'
            });
            try {
                await sendBookingEmail({
                    userId: booking.driver_id,
                    subject: `Rider cancelled - Cruise Kauaʻi`,
                    body: `Aloha,\n\n${booking.passenger_name} has cancelled their confirmed booking.\n\nReason: ${reason}\n\nThe seat(s) have been made available again.\n\nMahalo,\nCruise Kauaʻi Team`
                });
            } catch (e) { console.error(e); }
            alert(`Booking cancelled. A ${refundPercentage} refund will be processed.`);
            setShowRiderCancelModal(false);
            setRiderBookingToCancel(null);
            loadData();
        } catch (error) {
            console.error(error);
            alert("Error cancelling booking. Please try again.");
        }
    };

    const handleSubmitReview = async () => {
        if (reviewData.rating === 0) { alert("Please select a rating."); return; }
        const isDriver = currentReviewRide.driver_id === user.id;
        await base44.entities.Rating.create({
            ride_id: currentReviewRide.id,
            rated_by_user_id: user.id,
            rated_user_id: currentReviewUser.id,
            rating_value: reviewData.rating,
            comment: reviewData.comment,
            trip_role: isDriver ? 'passenger' : 'driver'
        });
        alert("Review submitted! Thank you!");
        setShowReviewModal(false);
        setReviewData({ rating: 0, comment: '' });
        loadData();
    };

    if (isLoading) return <div className="p-8 text-center">Loading your rides...</div>;

    return (
        <div className="p-4 md:p-8 bg-white">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">confirmed rides</h1>
                    <p className="text-gray-500 text-sm mt-0.5">your upcoming trips & reviews</p>
                </div>

                {/* Needs Review */}
                {ridesNeedingReview.length > 0 && (
                    <Card className="shadow-lg border-orange-300 bg-orange-50 rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-900">
                                <Star className="w-6 h-6 text-orange-600"/>
                                needs review ({ridesNeedingReview.length})
                            </CardTitle>
                            <p className="text-sm text-orange-700">leave a review for your past trips!</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {ridesNeedingReview.map(({ booking, ride }) => {
                                const isDriver = String(ride.driver_id) === String(user?.id);
                                const otherUsername = isDriver
                                    ? (booking.passenger_username || booking.passenger_name)
                                    : (booking.driver_username || ride.driver_name);
                                const otherUserId = isDriver ? booking.passenger_id : ride.driver_id;
                                return (
                                    <div key={booking.id} className="bg-white rounded-lg p-4 border border-orange-200">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 mb-1">
                                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(parseDateString(ride.departure_date), "EEE, MMM d")}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatTime12Hour(ride.departure_time)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            <span className="font-semibold text-secondary">{ride.departure_location} → {ride.destination}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">Trip with @{otherUsername}</p>
                                        <Button
                                            onClick={() => {
                                                setCurrentReviewUser({ username: otherUsername, id: otherUserId });
                                                setCurrentReviewRide(ride);
                                                setShowReviewModal(true);
                                            }}
                                            className="w-full bg-primary hover:bg-primary/90 rounded-2xl"
                                        >
                                            leave review
                                        </Button>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                {/* Upcoming Rides */}
                {upcomingRides.length > 0 ? (
                    <Card className="shadow-lg border-blue-200 bg-blue-50 rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-secondary">
                                <Calendar className="w-6 h-6 text-blue-600"/>
                                upcoming rides ({upcomingRides.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {upcomingRides.map(ride => {
                                const isDriver = String(ride.driver_id) === String(user?.id);
                                const bookingsForRide = activeBookings.filter(b => b.ride_id === ride.id && b.booking_status === 'confirmed');

                                return (
                                    <div key={ride.id} className="bg-white rounded-xl border border-blue-200 overflow-hidden">
                                        <button
                                            onClick={() => { if (isDriver) { setSelectedDriverRide(ride); setShowDriverRideModal(true); } }}
                                            className={`w-full text-left p-4 ${isDriver ? 'hover:bg-blue-50 cursor-pointer' : ''} transition-colors`}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(parseDateString(ride.departure_date), "EEE, MMM d")}</span>
                                                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatTime12Hour(ride.departure_time)}</span>
                                                </div>
                                                {isDriver && <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                <span className="font-semibold text-secondary">{ride.departure_location} → {ride.destination}</span>
                                            </div>
                                            <Badge variant="outline" className={`text-xs ${isDriver ? 'bg-green-50 text-green-700 border-green-300' : 'bg-blue-50 text-blue-700 border-blue-300'}`}>
                                                {isDriver ? 'you\'re driving' : 'you\'re riding'}
                                            </Badge>
                                        </button>

                                        {/* Show chat buttons for each confirmed booking */}
                                        {bookingsForRide.length > 0 && (
                                            <div className="border-t border-blue-100 p-3 space-y-2">
                                                {bookingsForRide.map(booking => {
                                                    const isPassenger = String(booking.passenger_id) === String(user?.id);
                                                    const otherPartyUsername = isDriver
                                                        ? (booking.passenger_username || booking.passenger_name)
                                                        : (booking.driver_username || ride.driver_name || 'Driver');
                                                    return (
                                                        <div key={booking.id} className="flex items-center justify-between gap-2">
                                                            <span className="text-sm text-gray-600">
                                                                {isDriver ? `@${booking.passenger_username || booking.passenger_name}` : `@${otherPartyUsername}`}
                                                                {' • '}{booking.seats_booked} seat{booking.seats_booked > 1 ? 's' : ''}
                                                            </span>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    onClick={() => handleOpenChat(booking, otherPartyUsername, '')}
                                                                    size="sm"
                                                                    className="bg-primary hover:bg-primary/90 rounded-2xl"
                                                                >
                                                                    <MessageSquare className="w-4 h-4 mr-1" />
                                                                    chat
                                                                </Button>
                                                                {isPassenger && (
                                                                    <Button
                                                                        onClick={() => { setRiderBookingToCancel(booking); setShowRiderCancelModal(true); }}
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="border-red-300 text-red-600 hover:bg-red-50 rounded-2xl"
                                                                    >
                                                                        cancel
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* If passenger but no booking found in bookingsForRide, show own booking */}
                                                {!isDriver && bookingsForRide.filter(b => String(b.passenger_id) === String(user?.id)).length === 0 && (() => {
                                                    const myBooking = activeBookings.find(b =>
                                                        String(b.ride_id) === String(ride.id) &&
                                                        String(b.passenger_id) === String(user?.id)
                                                    );
                                                    if (!myBooking) return null;
                                                    const driverUsername = myBooking.driver_username || ride.driver_name || 'Driver';
                                                    return (
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-sm text-gray-600">@{driverUsername}</span>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    onClick={() => handleOpenChat(myBooking, driverUsername, '')}
                                                                    size="sm"
                                                                    className="bg-primary hover:bg-primary/90 rounded-2xl"
                                                                >
                                                                    <MessageSquare className="w-4 h-4 mr-1" />
                                                                    chat
                                                                </Button>
                                                                <Button
                                                                    onClick={() => { setRiderBookingToCancel(myBooking); setShowRiderCancelModal(true); }}
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-red-300 text-red-600 hover:bg-red-50 rounded-2xl"
                                                                >
                                                                    cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                        <CardContent className="p-8 text-center text-gray-500">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="font-medium">No upcoming confirmed rides</p>
                            <p className="text-sm mt-1">Book or post a ride to get started!</p>
                        </CardContent>
                    </Card>
                )}

                {/* Past Rides */}
                <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                    <CardHeader
                        className="cursor-pointer select-none"
                        onClick={() => setShowPastRides(!showPastRides)}
                    >
                        <CardTitle className="flex items-center justify-between text-gray-700">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-gray-400" />
                                past rides {pastRides.length > 0 && `(${pastRides.length})`}
                            </div>
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showPastRides ? 'rotate-180' : ''}`} />
                        </CardTitle>
                    </CardHeader>
                    {showPastRides && (
                        <CardContent className="space-y-3 pt-0">
                            {pastRides.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">no past rides yet</p>
                            ) : (
                                pastRides.map(ride => {
                                    const isDriver = String(ride.driver_id) === String(user?.id);
                                    const myBooking = activeBookings.find(b =>
                                        String(b.ride_id) === String(ride.id) &&
                                        String(b.passenger_id) === String(user?.id)
                                    );
                                    const otherPartyName = isDriver
                                        ? (myBooking ? (myBooking.passenger_username || myBooking.passenger_name) : 'passengers')
                                        : (ride.driver_username || ride.driver_name);
                                    return (
                                        <div key={ride.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-semibold text-gray-800 text-sm truncate">{ride.departure_location} → {ride.destination}</p>
                                                <Badge variant="outline" className={`text-xs shrink-0 ${isDriver ? 'text-green-700 border-green-300' : 'text-blue-700 border-blue-300'}`}>
                                                    {isDriver ? 'drove' : 'rode'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-gray-500 flex items-center gap-3">
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(parseDateString(ride.departure_date), "EEE, MMM d yyyy")}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime12Hour(ride.departure_time)}</span>
                                            </p>
                                            <p className="text-xs text-gray-400">with @{otherPartyName}</p>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    )}
                </Card>

                <ChatModal
                    isOpen={showChatModal}
                    onClose={() => setShowChatModal(false)}
                    booking={selectedBooking}
                    otherPartyName={selectedChatName}
                    otherPartyPicture={selectedChatPicture}
                />
                <RiderCancelModal
                    isOpen={showRiderCancelModal}
                    onClose={() => { setShowRiderCancelModal(false); setRiderBookingToCancel(null); }}
                    booking={riderBookingToCancel}
                    ride={riderBookingToCancel ? allRidesData.find(r => r.id === riderBookingToCancel.ride_id) : null}
                    onConfirmCancel={handleConfirmRiderCancel}
                />
                <DriverRideModal
                    isOpen={showDriverRideModal}
                    onClose={() => { setShowDriverRideModal(false); setSelectedDriverRide(null); }}
                    ride={selectedDriverRide}
                    bookings={activeBookings}
                    onRideUpdated={loadData}
                />

                {/* Review Modal */}
                <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                    <DialogContent className="sm:max-w-md bg-white rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-secondary">
                                how was your trip with @{currentReviewUser?.username}?
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} onClick={() => setReviewData({ ...reviewData, rating: star })} className="transition-transform hover:scale-110">
                                        <Star className={`w-12 h-12 ${star <= reviewData.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                                    </button>
                                ))}
                            </div>
                            <Textarea
                                value={reviewData.comment}
                                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                                placeholder="Share your experience..."
                                className="h-32 rounded-2xl"
                            />
                            <Button onClick={handleSubmitReview} className="w-full bg-primary hover:bg-primary/90 rounded-2xl" disabled={reviewData.rating === 0}>
                                submit review
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}