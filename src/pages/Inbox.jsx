import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageSquare, Star, Bell, Clock, AlertTriangle, ChevronRight, UserPlus, MapPin, Calendar, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import ReportModal from "../components/inbox/ReportModal";
import ChatModal from "../components/inbox/ChatModal";
import RiderRequestModal from "../components/inbox/RiderRequestModal";
import CancelBookingModal from "../components/rides/CancelBookingModal";

import { format } from "date-fns";
import { sendNotification } from "../components/utils/notifications";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

function DebugCard({ user, activeBookings, upcomingRides }) {
    const [allBookings, setAllBookings] = React.useState([]);
    const [myBookings, setMyBookings] = React.useState([]);
    
    React.useEffect(() => {
        const load = async () => {
            const bookings = await base44.entities.RideBooking.list();
            const rides = await base44.entities.Ride.list();
            setAllBookings(bookings);
            if (user?.id) {
                const mine = bookings.filter(b => 
                    String(b.passenger_id) === String(user.id) || 
                    String(b.driver_id) === String(user.id)
                );
                // Add ride info to each booking
                mine.forEach(b => {
                    b._ride = rides.find(r => String(r.id) === String(b.ride_id));
                });
                setMyBookings(mine);
            }
        };
        load();
    }, [user]);
    
    return (
        <Card className="shadow-md border-yellow-300 bg-yellow-50 rounded-3xl">
            <CardHeader>
                <CardTitle className="text-sm text-yellow-800">Debug Info</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-yellow-700 space-y-1">
                <p>Your ID: {user?.id}</p>
                <p>Active bookings count: {activeBookings.length}</p>
                <p>Needs review count: {ridesNeedingReview.length}</p>
                {myBookings.map(b => (
                    <p key={b.id} className="border-t pt-1 mt-1">
                        inActiveBookings: {String(activeBookings.some(ab => ab.id === b.id))} | inNeedsReview: {String(ridesNeedingReview.some(r => r.booking.id === b.id))}
                    </p>
                ))}
            </CardContent>
        </Card>
    );
}

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
    const [allRidesData, setAllRidesData] = useState([]);
    const [adminMessages, setAdminMessages] = useState([]);

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
            setAllRidesData(allRides);
            const allBookings = await base44.entities.RideBooking.list();

            console.log("Current user ID:", currentUser.id);
            console.log("All bookings count:", allBookings.length);
            
            // Debug: Log all confirmed+paid bookings
            const confirmedPaidBookings = allBookings.filter(b => b.booking_status === 'confirmed' && b.payment_status === 'paid');
            console.log("Confirmed+Paid bookings:", confirmedPaidBookings.map(b => ({
                id: b.id,
                passenger_id: b.passenger_id,
                driver_id: b.driver_id,
                status: b.booking_status,
                payment: b.payment_status
            })));

            const myRideIds = allRides.filter(r => String(r.driver_id) === String(currentUser.id)).map(r => r.id);
            // Only show pending requests where payment has been completed
            const pendingBookingRequests = allBookings.filter(b => 
                myRideIds.includes(b.ride_id) && 
                b.booking_status === 'pending' &&
                b.payment_status === 'paid'
            );
            setPendingRequests(pendingBookingRequests);

            // Get rider's own pending booking requests (only show if payment is completed)
            const riderPendingBookings = allBookings.filter(b => 
                String(b.passenger_id) === String(currentUser.id) && 
                b.booking_status === 'pending' &&
                b.payment_status === 'paid'
            );
            setMyPendingBookings(riderPendingBookings);

            // Active bookings: confirmed status with paid payment for both drivers and riders
            const userActiveBookings = allBookings.filter(b => {
                const isPassenger = String(b.passenger_id) === String(currentUser.id);
                const isDriver = String(b.driver_id) === String(currentUser.id);
                const isConfirmed = b.booking_status === 'confirmed';
                const isPaid = b.payment_status === 'paid';
                return (isPassenger || isDriver) && isConfirmed && isPaid;
            });

            const now = new Date();
            const needsReview = [];
            const stillActive = [];

            // Get ratings once for efficiency
            const allRatings = await base44.entities.Rating.list();

            for (const booking of userActiveBookings) {
                const ride = allRides.find(r => String(r.id) === String(booking.ride_id));

                if (ride) {
                    // Parse ride date/time in Hawaii timezone (UTC-10)
                    // Add 4 hours buffer after departure time before requiring review
                    const rideDateTimeStr = `${ride.departure_date}T${ride.departure_time || '23:59'}:00-10:00`;
                    const rideDateTime = new Date(rideDateTimeStr);
                    const reviewThreshold = new Date(rideDateTime.getTime() + 4 * 60 * 60 * 1000);

                    if (now > reviewThreshold) {
                        const userRating = allRatings.find(r => 
                            String(r.ride_id) === String(ride.id) && 
                            String(r.rated_by_user_id) === String(currentUser.id)
                        );

                        if (!userRating) {
                            needsReview.push({ booking, ride });
                        }
                    } else {
                        stillActive.push(booking);
                    }
                } else {
                    // Ride not found but booking exists - still show it as active
                    stillActive.push(booking);
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

            // Rides where I'm the driver
            const myUpcomingRides = allRides.filter(r => {
                if (String(r.driver_id) !== String(currentUser.id)) return false;
                if (r.status !== 'active' && r.status !== 'full') return false;
                const rideDateTime = new Date(`${r.departure_date}T${r.departure_time || '23:59'}`);
                return rideDateTime >= now;
            });
            
            // Rides where I'm a confirmed passenger (from stillActive bookings)
            const myBookedRides = stillActive
                .filter(b => String(b.passenger_id) === String(currentUser.id))
                .map(b => allRides.find(r => r.id === b.ride_id))
                .filter(ride => {
                    if (!ride) return false;
                    const rideDateTime = new Date(`${ride.departure_date}T${ride.departure_time || '23:59'}`);
                    return rideDateTime >= now;
                });
            
            const uniqueUpcomingRides = Array.from(new Set([...myUpcomingRides, ...myBookedRides].map(ride => ride.id)))
                .map(id => [...myUpcomingRides, ...myBookedRides].find(ride => ride.id === id));

            setUpcomingRides(uniqueUpcomingRides.sort((a,b) => new Date(`${a.departure_date}T${a.departure_time}`) - new Date(`${b.departure_date}T${b.departure_time}`)));

            // Load admin messages for this user
            const allAdminMessages = await base44.entities.AdminMessage.list('-created_date');
            const myAdminMessages = allAdminMessages.filter(m => m.recipient_id === currentUser.id);
            setAdminMessages(myAdminMessages);

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
            // Payment is already processed via Stripe Checkout
            // Just confirm the booking
            const ride = await base44.entities.Ride.get(booking.ride_id);

            const initialMessage = {
                sender_id: booking.passenger_id,
                sender_name: booking.passenger_name,
                message: booking.description,
                timestamp: new Date().toISOString()
            };

            await base44.entities.RideBooking.update(booking.id, {
                booking_status: 'confirmed',
                messages: [initialMessage]
            });

            if (ride) {
                const updatedSeats = ride.seats_available - booking.seats_booked;
                await base44.entities.Ride.update(ride.id, {
                    seats_available: updatedSeats,
                    status: updatedSeats <= 0 ? 'full' : 'active'
                });
            }

            // Send confirmation email to rider
            const riders = await base44.entities.User.list();
            const rider = riders.find(u => u.id === booking.passenger_id);
            if (rider?.email) {
                try {
                    await base44.integrations.Core.SendEmail({
                        to: rider.email,
                        subject: `🎉 Your ride request was accepted!`,
                        body: `
    Hi ${booking.passenger_name},

    Great news! Your ride request has been accepted by the driver.

    Trip Details:
    ${ride.departure_location} → ${ride.destination}
    Date: ${ride.departure_date}
    Time: ${ride.departure_time}

    Please log into Cruise Kauaʻi to chat with your driver.

    Mahalo,
    Cruise Kauaʻi Team
                        `.trim()
                    });
                } catch (emailError) {
                    console.error("Error sending confirmation email:", emailError);
                }
            }

            sendNotification(
                'Ride Request Accepted!',
                `${booking.passenger_name} can now join your trip.`
            );

            alert(`Request accepted! The rider has already paid and will be notified.`);
            loadData();
        } catch (error) {
            console.error("Error accepting request:", error);
            alert("Error accepting request: " + error.message);
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
            const isDriver = String(user?.id) === String(booking.driver_id);
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

                {/* Debug info - REMOVE AFTER TESTING */}
                <DebugCard user={user} activeBookings={activeBookings} upcomingRides={upcomingRides} />

                {adminMessages.length > 0 && (
                    <Card className={`shadow-lg rounded-3xl ${adminMessages.some(m => !m.is_read) ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-secondary">
                                <ShieldAlert className={`w-6 h-6 ${adminMessages.some(m => !m.is_read) ? 'text-red-600' : 'text-gray-600'}`}/>
                                messages from cruise kauaʻi team ({adminMessages.filter(m => !m.is_read).length} unread)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {adminMessages.map(msg => (
                                <div 
                                    key={msg.id} 
                                    className={`p-4 rounded-2xl border ${
                                        !msg.is_read 
                                            ? msg.message_type === 'warning' 
                                                ? 'bg-yellow-50 border-yellow-300'
                                                : msg.message_type === 'action_required'
                                                    ? 'bg-red-50 border-red-300'
                                                    : 'bg-blue-50 border-blue-300'
                                            : 'bg-white border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-secondary">{msg.subject}</p>
                                                {!msg.is_read && (
                                                    <Badge className={
                                                        msg.message_type === 'warning' 
                                                            ? 'bg-yellow-600'
                                                            : msg.message_type === 'action_required'
                                                                ? 'bg-red-600'
                                                                : 'bg-blue-600'
                                                    }>
                                                        {msg.message_type === 'action_required' ? 'action required' : msg.message_type}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{msg.message}</p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                {format(new Date(msg.created_date), "MMM d, yyyy 'at' h:mm a")}
                                            </p>
                                        </div>
                                        {!msg.is_read && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-2xl border-gray-300"
                                                onClick={async () => {
                                                    await base44.entities.AdminMessage.update(msg.id, { is_read: true });
                                                    loadData();
                                                }}
                                            >
                                                mark as read
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

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
                                const isDriver = String(ride.driver_id) === String(user?.id);
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
                                const isDriver = String(ride.driver_id) === String(user?.id);
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
                    <Card className="shadow-lg border-gray-200 bg-gray-50 rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-secondary">
                                <Clock className="w-6 h-6 text-yellow-600"/>
                                your pending requests ({myPendingBookings.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 mb-4">
                                Waiting for drivers to accept your ride requests
                            </p>
                            <div className="space-y-3">
                                {myPendingBookings.map(booking => {
                                    const ride = allRidesData.find(r => r.id === booking.ride_id) || {};
                                    const driverUser = getUserById(booking.driver_id);
                                    const driverUsername = driverUser?.username || booking.driver_username || 'Driver';
                                    
                                    return (
                                        <div key={booking.id} className="p-4 bg-white rounded-lg border border-gray-200">
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
                                                        {ride.departure_location || 'Loading...'} → {ride.destination || 'Loading...'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Driver: @{driverUsername} • {booking.seats_booked} seat(s) • ${booking.total_amount}
                                                </p>
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 rounded-2xl">
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
                                    const isDriver = String(user.id) === String(booking.driver_id);
                                    const otherUserId = isDriver ? booking.passenger_id : booking.driver_id;
                                    const otherUser = getUserById(otherUserId);
                                    const otherPartyUsername = otherUser?.username || (isDriver ? booking.passenger_name : "Driver");
                                    const otherPartyPicture = otherUser?.profile_picture_url || '';
                                    const otherPartyName = isDriver ? booking.passenger_name : "Driver";
                                    
                                    // Use allRidesData to find ride details (not upcomingRides which may not include all rides)
                                    const ride = allRidesData.find(r => r.id === booking.ride_id);

                                    return (
                                        <div key={booking.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                                            {ride ? (
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
                                            ) : (
                                                <div className="mb-3 text-sm text-gray-500">
                                                    Ride details loading...
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
                                <p className="text-lg font-semibold text-secondary">Processing...</p>
                                            <p className="text-sm text-gray-600">Confirming the booking</p>
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