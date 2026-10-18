import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TripReviewModal from "@/components/rating/TripReviewModal";
import useTripReviewPrompt from "@/components/rating/useTripReviewPrompt";
import getPendingTripReviews from "@/components/rating/getPendingTripReviews";
import { MapPin, Calendar, Clock, ChevronRight, ChevronDown, MessageSquare, Star } from "lucide-react";
import { format } from "date-fns";
import ChatModal from "../components/inbox/ChatModal";
import RiderCancelModal from "../components/inbox/RiderCancelModal";
import DriverRideModal from "../components/inbox/DriverRideModal";
import { sendBookingEmail } from "../functions/sendBookingEmail";
import PendingTripsCard from "../components/inbox/PendingTripsCard";
import MyRideRequestsCard from "../components/inbox/MyRideRequestsCard";
import { getHawaiiNow, parseRideDateTimeHST, parseDateString, formatTime12Hour } from "@/lib/hstHelpers";

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

    const [myPendingBookings, setMyPendingBookings] = useState([]);
    const [myRideRequests, setMyRideRequests] = useState([]);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            const allBookings = await base44.entities.RideBooking.list('-created_date', 500);

            // Collect ride IDs from bookings we're involved in
            const myBookingRideIds = allBookings
                .filter(b => String(b.passenger_id) === String(currentUser.id) || String(b.driver_id) === String(currentUser.id))
                .map(b => b.ride_id)
                .filter(id => id && !id.startsWith('ride-request-'));

            // Fetch own rides (as driver) + rides from bookings (as passenger)
            const [myOwnRides, ...bookingRideResults] = await Promise.all([
                base44.entities.Ride.list('-created_date', 500),
                ...myBookingRideIds.map(id => base44.entities.Ride.get(id).catch(() => null))
            ]);

            const rideMap = new Map();
            [...myOwnRides, ...bookingRideResults].forEach(r => { if (r) rideMap.set(r.id, r); });
            const allRides = Array.from(rideMap.values());
            setAllRidesData(allRides);

            // Rider's pending paid bookings (awaiting driver acceptance)
            const riderPendingBookings = allBookings.filter(b =>
                String(b.passenger_id) === String(currentUser.id) &&
                b.booking_status === 'pending' &&
                b.payment_status === 'paid'
            );
            setMyPendingBookings(riderPendingBookings);

            const confirmedBookings = allBookings.filter(b => {
                const isPassenger = String(b.passenger_id) === String(currentUser.id);
                const isDriver = String(b.driver_id) === String(currentUser.id);
                const isConfirmedOrPending = b.booking_status === 'confirmed' || b.booking_status === 'pending';
                const isPaid = b.payment_status === 'paid';
                const isRideRequestReply = b.booking_status === 'confirmed' && b.total_amount === 0 && b.ride_id?.startsWith('ride-request-');
                return (isPassenger || isDriver) && isConfirmedOrPending && (isPaid || isRideRequestReply);
            });
            setActiveBookings(confirmedBookings);

            const hawaiiNow = getHawaiiNow();
            const nowComparable = hawaiiNow.toComparable();

            const needsReview = await getPendingTripReviews(allBookings, allRides, currentUser.id);
            setRidesNeedingReview(needsReview);

            // Upcoming rides (driver)
            const myUpcomingRides = allRides.filter(r => {
                if (String(r.driver_id) !== String(currentUser.id)) return false;
                if (r.status !== 'active' && r.status !== 'full') return false;
                const rideDateTime = parseRideDateTimeHST(r.departure_date, r.departure_time);
                return rideDateTime.toComparable() > nowComparable;
            });

            // Upcoming rides (passenger) - use all confirmedBookings, not just stillActive
            const myBookedRides = confirmedBookings
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

            // Past rides: driver (any status) OR confirmed passenger, where departure has passed
            const passengerRideIds = new Set(
                allBookings
                    .filter(b => String(b.passenger_id) === String(currentUser.id) && b.booking_status === 'confirmed')
                    .map(b => b.ride_id)
            );
            const myPastRides = allRides.filter(r => {
                const isDriver = String(r.driver_id) === String(currentUser.id);
                const isPassenger = passengerRideIds.has(r.id);
                if (!isDriver && !isPassenger) return false;
                const rideDateTime = parseRideDateTimeHST(r.departure_date, r.departure_time);
                return rideDateTime.toComparable() <= nowComparable;
            }).sort((a, b) =>
                parseRideDateTimeHST(b.departure_date, b.departure_time).toComparable() -
                parseRideDateTimeHST(a.departure_date, a.departure_time).toComparable()
            );
            setPastRides(myPastRides);

            // Load my ride requests (active and future only)
            const allRideRequests = await base44.entities.RidePost.filter({
                rider_id: currentUser.id,
                status: 'active'
            });

            const futureRequests = allRideRequests.filter(request => {
                if (!request.departure_date || !request.departure_time) return false;
                const rideDateTime = parseRideDateTimeHST(request.departure_date, request.departure_time);
                return rideDateTime.toComparable() > hawaiiNow.toComparable();
            });

            setMyRideRequests(futureRequests);

        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    };

    const handleRideRequestUpdate = async (request, action) => {
        if (action === 'cancel') {
            try {
                await base44.entities.RidePost.update(request.id, {
                    status: 'cancelled'
                });
                alert('Ride request cancelled successfully!');
                loadData();
            } catch (error) {
                console.error('Error cancelling request:', error);
                alert('Failed to cancel ride request. Please try again.');
            }
        } else {
            loadData();
        }
    };

    const handleCancelPendingRequest = async (booking) => {
        if (!confirm("Are you sure you want to cancel this ride request? Your payment will be refunded.")) return;
        try {
            await base44.entities.RideBooking.update(booking.id, {
                booking_status: 'cancelled',
                cancellation_reason: 'Cancelled by rider before acceptance',
                cancellation_date: new Date().toISOString()
            });
            const ride = allRidesData.find(r => r.id === booking.ride_id);
            // Send confirmation email to the rider who cancelled
            try {
                await sendBookingEmail({
                    userId: booking.passenger_id,
                    subject: `Your ride request is cancelled - Cruise Kauaʻi`,
                    body: `Aloha ${booking.passenger_name},\n\nYour ride request${ride ? ` for ${ride.departure_location} → ${ride.destination}` : ''} has been cancelled.\n\nYour payment will be refunded.\n\nMahalo,\nCruise Kauaʻi Team`
                });
            } catch (e) { console.error(e); }
            // Notify driver that rider cancelled
            try {
                await sendBookingEmail({
                    userId: booking.driver_id,
                    subject: `Ride request cancelled - Cruise Kauaʻi`,
                    body: `Aloha,\n\n${booking.passenger_name} has cancelled their ride request before you accepted it.\n\nNo action is needed on your end.\n\nMahalo,\nCruise Kauaʻi Team`
                });
            } catch (e) { console.error(e); }
            alert("Ride request cancelled successfully. Your payment will be refunded.");
            loadData();
        } catch (error) {
            console.error("Error cancelling request:", error);
            alert("Error cancelling request. Please try again.");
        }
    };

    const handleMessageDriverFromPending = (booking, driverUsername, driverPicture) => {
        setSelectedBooking(booking);
        setSelectedChatName(driverUsername);
        setSelectedChatPicture(driverPicture || '');
        setShowChatModal(true);
    };

    const handlePayDifference = async (booking) => {
        try {
            const response = await base44.functions.invoke('createDifferenceCheckout', {
                booking_id: booking.id,
                success_url: window.location.origin + '/confirmedrides',
                cancel_url: window.location.origin + '/confirmedrides'
            });
            if (response.data?.checkout_url) {
                window.location.href = response.data.checkout_url;
            }
        } catch (error) {
            console.error('Error creating difference checkout:', error);
            alert('Error processing payment. Please try again.');
        }
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
            // Send confirmation email to the rider who cancelled
            try {
                await sendBookingEmail({
                    userId: booking.passenger_id,
                    subject: `Your cancellation is confirmed - Cruise Kauaʻi`,
                    body: `Aloha ${booking.passenger_name},\n\nYour booking for the ride from ${ride?.departure_location} → ${ride?.destination} on ${ride?.departure_date} at ${ride?.departure_time} has been cancelled.\n\nReason: ${reason}\n\nRefund: ${refundPercentage} of your payment will be processed.\n\nMahalo,\nCruise Kauaʻi Team`
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

    const { review, openReview, closeReview } = useTripReviewPrompt(ridesNeedingReview, user?.id, loadData);

    if (isLoading) return <div className="p-8 text-center">Loading your rides...</div>;

    return (
        <div className="p-4 md:p-8 bg-white">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">my rides</h1>
                    <p className="text-gray-500 text-sm mt-0.5">view + edit your rides & ride requests</p>
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
                                return (
                                    <div key={booking.id} className="bg-white rounded-lg p-4 border border-orange-200">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 mb-1">
                                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(parseDateString(ride.departure_date), "MM/dd/yyyy")}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatTime12Hour(ride.departure_time)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            <span className="font-semibold text-secondary">{ride.departure_location} → {ride.destination}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">Trip with @{otherUsername}</p>
                                        <Button
                                            onClick={() => openReview(booking, ride)}
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

                {/* My Ride Requests */}
                <MyRideRequestsCard
                    myRequests={myRideRequests}
                    onRequestUpdated={handleRideRequestUpdate}
                />

                {/* Pending Trips Card for Riders */}
                <PendingTripsCard
                    pendingBookings={myPendingBookings}
                    allRidesData={allRidesData}
                    getUserById={() => null}
                    onCancelRequest={handleCancelPendingRequest}
                    onMessageDriver={handleMessageDriverFromPending}
                    onPayDifference={handlePayDifference}
                />

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
                                const bookingsForRide = activeBookings.filter(b => b.ride_id === ride.id && (b.booking_status === 'confirmed' || b.booking_status === 'pending'));

                                return (
                                    <div key={ride.id} className="bg-white rounded-xl border border-blue-200 overflow-hidden">
                                        <button
                                            onClick={() => { if (isDriver) { setSelectedDriverRide(ride); setShowDriverRideModal(true); } }}
                                            className={`w-full text-left p-4 ${isDriver ? 'hover:bg-blue-50 cursor-pointer' : ''} transition-colors`}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(parseDateString(ride.departure_date), "MM/dd/yyyy")}</span>
                                                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatTime12Hour(ride.departure_time)}</span>
                                                </div>
                                                {isDriver && <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                <span className="font-semibold text-secondary">{ride.departure_location} → {ride.destination}</span>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                <Badge variant="outline" className={`text-xs ${isDriver ? 'bg-green-50 text-green-700 border-green-300' : 'bg-blue-50 text-blue-700 border-blue-300'}`}>
                                                    {isDriver ? 'you\'re driving' : 'you\'re riding'}
                                                </Badge>
                                                {!isDriver && activeBookings.find(b => b.ride_id === ride.id && String(b.passenger_id) === String(user?.id))?.booking_status === 'pending' && (
                                                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                                                        awaiting driver acceptance
                                                    </Badge>
                                                )}
                                            </div>
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
                                    let withLine = '';
                                    if (isDriver) {
                                        const passengers = activeBookings.filter(b =>
                                            String(b.ride_id) === String(ride.id) && b.booking_status === 'confirmed'
                                        );
                                        if (passengers.length > 0) {
                                            withLine = passengers.map(b => `@${b.passenger_username || b.passenger_name}`).join(', ');
                                        } else {
                                            withLine = 'no passengers';
                                        }
                                    } else {
                                        withLine = `@${ride.driver_username || ride.driver_name}`;
                                    }
                                    return (
                                        <div key={ride.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-semibold text-gray-800 text-sm truncate">{ride.departure_location} → {ride.destination}</p>
                                                <Badge variant="outline" className={`text-xs shrink-0 ${isDriver ? 'text-green-700 border-green-300' : 'text-blue-700 border-blue-300'}`}>
                                                    {isDriver ? 'drove' : 'rode'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-gray-500 flex items-center gap-3">
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(parseDateString(ride.departure_date), "MM/dd/yyyy")}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime12Hour(ride.departure_time)}</span>
                                            </p>
                                            <p className="text-xs text-gray-400">with {withLine}</p>
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

                <TripReviewModal review={review} userId={user?.id} onClose={closeReview} onSaved={loadData} />
            </div>
        </div>
    );
}