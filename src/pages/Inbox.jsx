import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageSquare, Star, Bell, Clock, AlertTriangle, ChevronRight, UserPlus, MapPin, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import ReportModal from "../components/inbox/ReportModal";
import ChatModal from "../components/inbox/ChatModal";
import RiderRequestModal from "../components/inbox/RiderRequestModal";
import CancelBookingModal from "../components/rides/CancelBookingModal";
import { processRiderPayment } from "@/functions/processRiderPayment";
import { format } from "date-fns";
import { sendNotification } from "../components/utils/notifications";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

export default function InboxPage() {
    const [activeBookings, setActiveBookings] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [myPendingBookings, setMyPendingBookings] = useState([]);
    const [upcomingRides, setUpcomingRides] = useState([]);
    const [ridesNeedingReview, setRidesNeedingReview] = useState([]);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [showRiderRequestModal, setShowRiderRequestModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedChatName, setSelectedChatName] = useState('');
    const [selectedChatPicture, setSelectedChatPicture] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [reviewData, setReviewData] = useState({ rating: 0, comment: '' });
    const [currentReviewUser, setCurrentReviewUser] = useState(null);
    const [currentReviewRide, setCurrentReviewRide] = useState(null);
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        loadData();
        checkNotifications();
    }, []);

    const checkNotifications = () => {
        if ('Notification' in window) {
            setNotificationsEnabled(Notification.permission === 'granted');
        }
    };

    const requestNotifications = async () => {
        if ('Notification' in window) {
            try {
                const permission = await Notification.requestPermission();
                setNotificationsEnabled(permission === 'granted');
                
                if (permission === 'granted') {
                    await base44.auth.updateMe({ notifications_enabled: true });
                    alert("Notifications enabled! You'll receive updates about your trips and messages.");
                    loadData();
                } else {
                    alert("Notification permission was denied. You can enable it later in your browser settings.");
                }
            } catch (error) {
                console.error("Error requesting notifications:", error);
                alert("There was an error enabling notifications. Please try again or check your browser settings.");
            }
        } else {
            alert("Your browser doesn't support notifications.");
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);

            const allUsersList = await base44.entities.User.list();
            setAllUsers(allUsersList);

            const allRides = await base44.entities.Ride.list();
            const allBookings = await base44.entities.RideBooking.list();

            const myRideIds = allRides.filter(r => r.driver_id === currentUser.id).map(r => r.id);
            const pendingBookingRequests = allBookings.filter(b => 
                myRideIds.includes(b.ride_id) && 
                b.booking_status === 'pending'
            );
            setPendingRequests(pendingBookingRequests);

            // Get rider's own pending booking requests
            const riderPendingBookings = allBookings.filter(b => 
                b.passenger_id === currentUser.id && 
                b.booking_status === 'pending'
            );
            setMyPendingBookings(riderPendingBookings);

            const userActiveBookings = allBookings.filter(b => 
                (b.passenger_id === currentUser.id || b.driver_id === currentUser.id) && 
                b.booking_status === 'confirmed'
            );

            const now = new Date();
            const needsReview = [];
            const stillActive = [];
            
            for (const booking of userActiveBookings) {
                const ride = allRides.find(r => r.id === booking.ride_id);
                if (ride) {
                    const rideDateTime = new Date(`${ride.departure_date}T${ride.departure_time || '23:59'}`);
                    if (rideDateTime < now) {
                        const allRatings = await base44.entities.Rating.list();
                        const userRating = allRatings.find(r => 
                            r.ride_id === ride.id && 
                            r.rated_by_user_id === currentUser.id
                        );
                        
                        if (!userRating) {
                            needsReview.push({ booking, ride });
                        }
                    } else {
                        stillActive.push(booking);
                    }
                }
            }

            setRidesNeedingReview(needsReview);
            setActiveBookings(stillActive);

            if (needsReview.length > 0 && !showReviewModal) {
                const { booking, ride } = needsReview[0];
                const isDriver = ride.driver_id === currentUser.id;
                const otherUserId = isDriver ? booking.passenger_id : ride.driver_id;
                const otherUser = allUsersList.find(u => u.id === otherUserId);
                const otherUsername = otherUser?.username || (isDriver ? booking.passenger_name : "Driver");
                
                setCurrentReviewUser({ 
                    username: otherUsername, 
                    id: otherUserId 
                });
                setCurrentReviewRide(ride);
                setShowReviewModal(true);
            }

            const myUpcomingRides = allRides.filter(r => {
                if (r.driver_id !== currentUser.id) return false;
                if (r.status !== 'active') return false;
                const rideDateTime = new Date(`${r.departure_date}T${r.departure_time || '23:59'}`);
                return rideDateTime > now;
            });
            
            const myUpcomingBookings = stillActive
                .map(b => allRides.find(r => r.id === b.ride_id))
                .filter(ride => {
                    if (!ride) return false;
                    const rideDateTime = new Date(`${ride.departure_date}T${ride.departure_time || '23:59'}`);
                    return rideDateTime > now;
                });
            
            const uniqueUpcomingRides = Array.from(new Set([...myUpcomingRides, ...myUpcomingBookings].map(ride => ride.id)))
                .map(id => [...myUpcomingRides, ...myUpcomingBookings].find(ride => ride.id === id));

            setUpcomingRides(uniqueUpcomingRides.sort((a,b) => new Date(`${a.departure_date}T${a.departure_time}`) - new Date(`${b.departure_date}T${b.departure_time}`)));

        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    };

    const handleSubmitReview = async () => {
        if (reviewData.rating === 0) {
            alert("Please select a rating before submitting.");
            return;
        }

        const isDriver = currentReviewRide.driver_id === user.id;
        
        await base44.entities.Rating.create({
            ride_id: currentReviewRide.id,
            rated_by_user_id: user.id,
            rated_user_id: currentReviewUser.id,
            rating_value: reviewData.rating,
            comment: reviewData.comment,
            trip_role: isDriver ? 'passenger' : 'driver'
        });

        alert("Review submitted! Thank you for building the Cruise Kauaʻi community!");
        setShowReviewModal(false);
        setReviewData({ rating: 0, comment: '' });
        loadData();
    };

    const handleOpenChat = (booking, otherPartyName, otherPartyPicture) => {
        setSelectedBooking(booking);
        setSelectedChatName(otherPartyName);
        setSelectedChatPicture(otherPartyPicture);
        setShowChatModal(true);
    };

    const handleViewRequest = (booking) => {
        setSelectedBooking(booking);
        setShowRiderRequestModal(true);
    };

    const handleAcceptRequest = async (booking) => {
        setShowRiderRequestModal(false);
        setIsProcessingPayment(true);

        try {
            // Process payment using rider's saved payment method
            const { data: paymentResult } = await processRiderPayment({ booking_id: booking.id });

            if (paymentResult.error) {
                throw new Error(paymentResult.error);
            }

            const ride = await base44.entities.Ride.get(booking.ride_id);
            
            const totalAmount = paymentResult.amount;
            const connectFee = paymentResult.connectFee;

            await base44.entities.Transaction.create({
                booking_id: booking.id,
                ride_id: booking.ride_id,
                payer_id: booking.passenger_id,
                payer_name: booking.passenger_name,
                recipient_id: booking.driver_id,
                recipient_name: user.full_name,
                ride_amount: booking.total_amount,
                connect_fee: connectFee,
                total_amount: totalAmount,
                payment_method_last4: paymentResult.last4,
                payment_method_brand: paymentResult.brand,
                transaction_status: 'completed',
                stripe_charge_id: paymentResult.paymentIntentId
            });

            const initialMessage = {
                sender_id: booking.passenger_id,
                sender_name: booking.passenger_name,
                message: booking.description,
                timestamp: new Date().toISOString()
            };

            await base44.entities.RideBooking.update(booking.id, {
                booking_status: 'confirmed',
                payment_status: 'paid',
                stripe_charge_id: paymentResult.paymentIntentId,
                messages: [initialMessage]
            });

            if (ride) {
                const updatedSeats = ride.seats_available - booking.seats_booked;
                await base44.entities.Ride.update(ride.id, {
                    seats_available: updatedSeats,
                    status: updatedSeats <= 0 ? 'full' : 'active'
                });
            }

            sendNotification(
                'Ride Request Accepted!',
                `${booking.passenger_name} can now join your trip.`
            );

            alert(`Request accepted! Payment of $${totalAmount.toFixed(2)} has been charged to the rider's card.`);
            loadData();
        } catch (error) {
            console.error("Error accepting request:", error);
            alert("Error processing payment: " + error.message);
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handleRejectRequest = async (booking) => {
        try {
            await base44.entities.RideBooking.update(booking.id, {
                booking_status: 'rejected'
            });

            sendNotification(
                'Ride Request Rejected',
                'A rider request has been declined.'
            );

            alert("Request rejected. The rider has been notified.");
            setShowRiderRequestModal(false);
            loadData();
        } catch (error) {
            console.error("Error rejecting request:", error);
            alert("Error rejecting request. Please try again.");
        }
    };

    const handleCancelBooking = (booking) => {
        setBookingToCancel(booking);
        setShowCancelModal(true);
    };

    const handleCancelPendingRequest = async (booking) => {
        if (!confirm("Are you sure you want to cancel this ride request?")) return;
        
        try {
            await base44.entities.RideBooking.update(booking.id, {
                booking_status: 'cancelled',
                cancellation_reason: 'Cancelled by rider before acceptance',
                cancellation_date: new Date().toISOString()
            });
            
            alert("Ride request cancelled successfully.");
            loadData();
        } catch (error) {
            console.error("Error cancelling request:", error);
            alert("Error cancelling request. Please try again.");
        }
    };

    const handleConfirmCancel = async (booking, reason) => {
        try {
            const ride = await base44.entities.Ride.get(booking.ride_id);
            const rideDateTime = new Date(`${ride.departure_date}T${ride.departure_time}`);
            const hoursUntilRide = (rideDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);

            let refundPercentage = 0;
            if (hoursUntilRide >= 24) {
                refundPercentage = 1.0;
            } else if (hoursUntilRide >= 2) {
                refundPercentage = 0.5;
            } else {
                refundPercentage = 0;
            }

            const refundAmount = booking.total_amount * refundPercentage;

            if (refundAmount > 0 && booking.payment_status === 'paid') {
                await base44.entities.Transaction.create({
                    booking_id: booking.id,
                    ride_id: booking.ride_id,
                    payer_id: booking.driver_id,
                    payer_name: "Cruise Kauaʻi (Refund)",
                    recipient_id: booking.passenger_id,
                    recipient_name: booking.passenger_name,
                    ride_amount: -refundAmount,
                    connect_fee: 0,
                    total_amount: -refundAmount,
                    payment_method_last4: "",
                    payment_method_brand: "Refund",
                    transaction_status: 'completed',
                    stripe_charge_id: `refund_${Date.now()}`
                });
            }

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

            alert(`Booking cancelled. ${refundPercentage === 1 ? 'Full refund' : refundPercentage === 0.5 ? '50% refund' : 'No refund'} processed.`);
            setShowCancelModal(false);
            loadData();
        } catch (error) {
            console.error("Error cancelling booking:", error);
            alert("Error cancelling booking. Please try again.");
        }
    };

    const getUserById = (userId) => {
        return allUsers.find(u => u.id === userId);
    };

    const recentChats = activeBookings
        .filter(booking => booking.messages && booking.messages.length > 0)
        .map(booking => {
            const isDriver = user?.id === booking.driver_id;
            const otherUserId = isDriver ? booking.passenger_id : booking.driver_id;
            const otherUser = getUserById(otherUserId);
            const otherPartyUsername = otherUser?.username || (isDriver ? booking.passenger_name : "Driver");
            const otherPartyPicture = otherUser?.profile_picture_url || '';
            const lastMessage = booking.messages[booking.messages.length - 1];
            return {
                id: booking.id,
                name: otherPartyUsername,
                picture: otherPartyPicture,
                lastMessage: lastMessage.message,
                timestamp: lastMessage.timestamp,
                booking: booking
            };
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return (
        <div className="p-4 md:p-8 bg-white">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary">inbox</h1>
                        <p className="text-gray-600">manage your trip communications and leave ratings</p>
                    </div>
                    <Button
                        onClick={() => setShowReportModal(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl w-full sm:w-auto"
                    >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        report
                    </Button>
                </div>



                <Alert className="bg-teal-50 border-primary/50 text-secondary rounded-2xl">
                    <Bot className="h-5 w-5 text-primary" />
                    <AlertTitle className="font-bold">chatbot safety monitor</AlertTitle>
                    <AlertDescription>
                        Our AI chatbot monitors all messages to ensure no personal contact information is shared. 
                        Keep all communication within the app.
                    </AlertDescription>
                </Alert>

                {ridesNeedingReview.length > 0 && (
                    <Card className="shadow-lg border-orange-300 bg-orange-50 rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-900">
                                <Star className="w-6 h-6 text-orange-600"/>
                                needs review ({ridesNeedingReview.length})
                            </CardTitle>
                            <p className="text-sm text-orange-700">review your past trips before booking more!</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {ridesNeedingReview.map(({ booking, ride }) => {
                                const isDriver = ride.driver_id === user?.id;
                                const otherUserId = isDriver ? booking.passenger_id : ride.driver_id;
                                const otherUser = getUserById(otherUserId);
                                const otherUsername = otherUser?.username || (isDriver ? booking.passenger_name : "Driver");
                                
                                return (
                                    <div key={booking.id} className="bg-white rounded-lg p-4 border border-orange-200">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                <span>{format(new Date(ride.departure_date), "MMM d, yyyy")}</span>
                                                <Clock className="w-4 h-4 ml-2" />
                                                <span>{ride.departure_time}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                <span className="font-semibold text-secondary">
                                                    {ride.departure_location} → {ride.destination}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Trip with @{otherUsername}
                                            </p>
                                            <Button
                                                onClick={() => {
                                                    setCurrentReviewUser({ username: otherUsername, id: otherUserId });
                                                    setCurrentReviewRide(ride);
                                                    setShowReviewModal(true);
                                                }}
                                                className="w-full bg-primary hover:bg-primary/90 rounded-2xl mt-2"
                                            >
                                                leave review
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                {upcomingRides.length > 0 && (
                    <Card className="shadow-lg border-blue-200 bg-blue-50 rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-secondary">
                                <Calendar className="w-6 h-6 text-blue-600"/>
                                upcoming rides ({upcomingRides.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {upcomingRides.map(ride => {
                                const isDriver = ride.driver_id === user?.id;
                                const bookingsForRide = activeBookings.filter(b => b.ride_id === ride.id && b.booking_status === 'confirmed');
                                const participants = bookingsForRide
                                    .map(b => {
                                        const otherUser = getUserById(b.passenger_id);
                                        return otherUser?.username || b.passenger_name;
                                    })
                                    .filter(Boolean)
                                    .join(', ');
                                
                                return (
                                    <div key={ride.id} className="bg-white rounded-lg p-4 border border-blue-200">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{format(new Date(ride.departure_date), "MMM d, yyyy")}</span>
                                                    <Clock className="w-4 h-4 ml-2" />
                                                    <span>{ride.departure_time}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                <span className="font-semibold text-secondary">
                                                    {ride.departure_location} → {ride.destination}
                                                </span>
                                            </div>
                                            {isDriver ? (
                                                <p className="text-sm text-gray-600">
                                                    Driving with: {participants || 'No riders yet'}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-600">
                                                    Riding with: @{(() => {
                                                        const driverUser = getUserById(ride.driver_id);
                                                        return driverUser?.username || ride.driver_name || 'Driver';
                                                    })()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                {myPendingBookings.length > 0 && (
                    <Card className="shadow-lg border-yellow-200 bg-yellow-50 rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-secondary">
                                <Clock className="w-6 h-6 text-yellow-600"/>
                                your pending requests ({myPendingBookings.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-yellow-700 mb-4">
                                Waiting for drivers to accept your ride requests
                            </p>
                            <div className="space-y-3">
                                {myPendingBookings.map(booking => {
                                    const ride = upcomingRides.find(r => r.id === booking.ride_id) || 
                                                 { departure_location: 'Unknown', destination: 'Unknown', departure_date: '', departure_time: '' };
                                    const driverUser = getUserById(booking.driver_id);
                                    const driverUsername = driverUser?.username || booking.driver_username || 'Driver';
                                    
                                    return (
                                        <div key={booking.id} className="p-4 bg-white rounded-lg border border-yellow-200">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{ride.departure_date ? format(new Date(ride.departure_date), "MMM d, yyyy") : 'TBD'}</span>
                                                    {ride.departure_time && (
                                                        <>
                                                            <Clock className="w-4 h-4 ml-2" />
                                                            <span>{ride.departure_time}</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-primary" />
                                                    <span className="font-semibold text-secondary">
                                                        {ride.departure_location} → {ride.destination}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Driver: @{driverUsername} • {booking.seats_booked} seat(s) • ${booking.total_amount}
                                                </p>
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 rounded-2xl">
                                                    Awaiting driver approval
                                                </Badge>
                                                <Button
                                                    onClick={() => handleCancelPendingRequest(booking)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full mt-2 border-red-300 text-red-600 hover:bg-red-50 rounded-2xl"
                                                >
                                                    Cancel Request
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {pendingRequests.length > 0 && (
                    <Card className="shadow-lg border-blue-200 bg-blue-50 rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-secondary">
                                <UserPlus className="w-6 h-6 text-blue-600"/>
                                pending ride requests ({pendingRequests.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-blue-700 mb-4">
                                You have riders requesting to join your trips!
                            </p>
                            <div className="space-y-3">
                                {pendingRequests.map(request => (
                                    <button
                                        key={request.id}
                                        onClick={() => handleViewRequest(request)}
                                        className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-12 h-12 bg-gradient-to-r from-primary to-secondary">
                                                <AvatarFallback className="text-white font-semibold">
                                                    {getInitials(request.passenger_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="text-left">
                                                <p className="font-semibold text-secondary">{request.passenger_name}</p>
                                                <p className="text-sm text-gray-600">
                                                    Requesting {request.seats_booked} seat(s)
                                                </p>
                                                <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-300 rounded-2xl">
                                                    Pending
                                                </Badge>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-secondary">
                            <MessageSquare className="w-6 h-6 text-primary"/>
                            active trips ({activeBookings.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p>Loading trips...</p>
                        ) : activeBookings.length > 0 ? (
                            <div className="space-y-4">
                                {activeBookings.map(booking => {
                                    const isDriver = user.id === booking.driver_id;
                                    const otherUserId = isDriver ? booking.passenger_id : booking.driver_id;
                                    const otherUser = getUserById(otherUserId);
                                    const otherPartyUsername = otherUser?.username || (isDriver ? booking.passenger_name : "Driver");
                                    const otherPartyPicture = otherUser?.profile_picture_url || '';
                                    const otherPartyName = isDriver ? booking.passenger_name : "Driver";
                                    
                                    const ride = upcomingRides.find(r => r.id === booking.ride_id);

                                    return (
                                        <div key={booking.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                                            {ride && (
                                                <div className="mb-3">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{format(new Date(ride.departure_date), "MMM d, yyyy")}</span>
                                                        <Clock className="w-4 h-4 ml-2" />
                                                        <span>{ride.departure_time}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MapPin className="w-4 h-4 text-primary" />
                                                        <span className="font-semibold text-secondary">
                                                            {ride.departure_location} → {ride.destination}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <p className="text-sm text-gray-700 mb-2">
                                                {isDriver 
                                                    ? `Driving with @${otherPartyUsername}`
                                                    : `Riding with @${otherPartyUsername}, ${booking.seats_booked} seat(s) booked`
                                                }
                                            </p>
                                            
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <Badge variant="outline" className="mb-2 rounded-2xl border-gray-300 w-fit">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {booking.booking_status}
                                                </Badge>
                                                
                                                <Button
                                                    onClick={() => handleOpenChat(booking, otherPartyUsername, otherPartyPicture)}
                                                    className="bg-primary hover:bg-primary/90 px-6 py-2 rounded-2xl w-full sm:w-auto"
                                                >
                                                    <MessageSquare className="w-4 h-4 mr-2" />
                                                    Chat Here
                                                </Button>
                                            </div>
                                            
                                            {!isDriver && (
                                                <Button
                                                    onClick={() => handleCancelBooking(booking)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full mt-3 border-red-300 text-red-600 hover:bg-red-50 rounded-2xl"
                                                >
                                                    Cancel Booking
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">
                                No active trips. Book or post a ride to get started!
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-md border-gray-200 bg-white rounded-3xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-secondary">
                            <Bot className="w-6 h-6 text-primary"/>
                            recent messages
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentChats.length > 0 ? (
                            <div className="space-y-3">
                                {recentChats.map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() => handleOpenChat(chat.booking, chat.name, chat.picture)}
                                        className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-md transition-shadow text-left"
                                    >
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={chat.picture} />
                                            <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white font-semibold">
                                                {getInitials(chat.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-secondary">@{chat.name}</p>
                                            <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                                            <p className="text-xs text-gray-400">
                                                {format(new Date(chat.timestamp), "MMM d, h:mm a")}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">
                                None yet! Book a trip for messages to appear here.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <footer className="pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} Cruise Hawaiʻi. Specializing in carpooling and ridesharing across Hawaiʻi.
                </footer>

                <ChatModal
                    isOpen={showChatModal}
                    onClose={() => setShowChatModal(false)}
                    booking={selectedBooking}
                    otherPartyName={selectedChatName}
                    otherPartyPicture={selectedChatPicture}
                />

                <RiderRequestModal
                    isOpen={showRiderRequestModal}
                    onClose={() => setShowRiderRequestModal(false)}
                    booking={selectedBooking}
                    onAccept={handleAcceptRequest}
                    onReject={handleRejectRequest}
                />

                <CancelBookingModal
                    isOpen={showCancelModal}
                    onClose={() => setShowCancelModal(false)}
                    booking={bookingToCancel}
                    onConfirmCancel={handleConfirmCancel}
                />

                <ReportModal
                    isOpen={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    recentChats={recentChats}
                />

                {isProcessingPayment && (
                    <Dialog open={true}>
                        <DialogContent className="sm:max-w-md bg-white rounded-3xl">
                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                                <p className="text-lg font-semibold text-secondary">Processing Payment...</p>
                                <p className="text-sm text-gray-600">Charging the rider's saved card</p>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                    <DialogContent className="sm:max-w-md bg-white rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-secondary">
                                how was your trip with @{currentReviewUser?.username}?
                            </DialogTitle>
                            <p className="text-sm text-gray-600">leave a review to build the cruise kauaʻi community!</p>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setReviewData({ ...reviewData, rating: star })}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-12 h-12 ${
                                                star <= reviewData.rating
                                                    ? 'text-amber-400 fill-amber-400'
                                                    : 'text-gray-300'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <p className="font-medium text-gray-700">
                                    leave comments here about cleanliness, punctuality, sociability, and more
                                </p>
                                <Textarea
                                    value={reviewData.comment}
                                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                                    placeholder="Share your experience..."
                                    className="h-32 rounded-2xl"
                                />
                            </div>

                            <Button
                                onClick={handleSubmitReview}
                                className="w-full bg-primary hover:bg-primary/90 rounded-2xl"
                                disabled={reviewData.rating === 0}
                            >
                                submit review
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}