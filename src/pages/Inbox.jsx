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
import PendingTripsCard from "../components/inbox/PendingTripsCard";
import RejectionAlert from "../components/inbox/RejectionAlert";
import RiderCancelModal from "../components/inbox/RiderCancelModal";
import AdminMessageCard from "../components/inbox/AdminMessageCard";
import DriverRideModal from "../components/inbox/DriverRideModal";

import { format } from "date-fns";
import { sendNotification } from "../components/utils/notifications";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

// Helper to get current time in Hawaii (UTC-10) as a simple comparable object
const getHawaiiNow = () => {
    // Create formatter that outputs Hawaii time components
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Pacific/Honolulu',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    const parts = formatter.formatToParts(new Date());
    const get = (type) => parts.find(p => p.type === type)?.value;
    
    return {
        year: parseInt(get('year')),
        month: parseInt(get('month')),
        day: parseInt(get('day')),
        hour: parseInt(get('hour')),
        minute: parseInt(get('minute')),
        // For easy comparison: YYYYMMDDHHMM as number
        toComparable: function() {
            return this.year * 100000000 + this.month * 1000000 + this.day * 10000 + this.hour * 100 + this.minute;
        }
    };
};

// Helper to parse time strings in various formats (e.g., "19:30", "7:30pm", "730pm")
const parseTimeString = (timeStr) => {
    if (!timeStr) return { hours: 23, minutes: 59 };
    
    const normalized = timeStr.toLowerCase().trim();
    
    // Try HH:MM format first
    if (normalized.includes(':')) {
        const [h, m] = normalized.replace(/[ap]m/i, '').split(':').map(Number);
        let hours = h;
        if (normalized.includes('pm') && hours < 12) hours += 12;
        if (normalized.includes('am') && hours === 12) hours = 0;
        return { hours, minutes: m || 0 };
    }
    
    // Try formats like "730pm", "7pm", "1130am"
    const match = normalized.match(/^(\d{1,4})(am|pm)?$/);
    if (match) {
        const numPart = match[1];
        const period = match[2];
        let hours, minutes;
        
        if (numPart.length <= 2) {
            hours = parseInt(numPart);
            minutes = 0;
        } else if (numPart.length === 3) {
            hours = parseInt(numPart[0]);
            minutes = parseInt(numPart.substring(1));
        } else {
            hours = parseInt(numPart.substring(0, 2));
            minutes = parseInt(numPart.substring(2));
        }
        
        if (period === 'pm' && hours < 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        
        return { hours, minutes };
    }
    
    return { hours: 23, minutes: 59 };
};

// Helper to parse a ride date/time as comparable object (same format as getHawaiiNow)
const parseRideDateTimeHST = (dateStr, timeStr) => {
    if (!dateStr) return { toComparable: () => 0 }; // No date = treat as past
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const { hours, minutes } = parseTimeString(timeStr);
    
    return {
        year,
        month,
        day,
        hour: hours,
        minute: minutes,
        toComparable: function() {
            return this.year * 100000000 + this.month * 1000000 + this.day * 10000 + this.hour * 100 + this.minute;
        },
        // Add hours and return new comparable
        addHours: function(h) {
            let newHour = this.hour + h;
            let newDay = this.day;
            let newMonth = this.month;
            let newYear = this.year;
            
            while (newHour >= 24) {
                newHour -= 24;
                newDay++;
            }
            
            return {
                year: newYear,
                month: newMonth,
                day: newDay,
                hour: newHour,
                minute: this.minute,
                toComparable: function() {
                    return this.year * 100000000 + this.month * 1000000 + this.day * 10000 + this.hour * 100 + this.minute;
                }
            };
        }
    };
};

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
    const [showRiderCancelModal, setShowRiderCancelModal] = useState(false);
    const [riderBookingToCancel, setRiderBookingToCancel] = useState(null);
    const [rejectedBookings, setRejectedBookings] = useState([]);
    const [dismissedRejections, setDismissedRejections] = useState([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [reviewData, setReviewData] = useState({ rating: 0, comment: '' });
    const [currentReviewUser, setCurrentReviewUser] = useState(null);
    const [currentReviewRide, setCurrentReviewRide] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [allRidesData, setAllRidesData] = useState([]);
    const [adminMessages, setAdminMessages] = useState([]);
    const [showDriverRideModal, setShowDriverRideModal] = useState(false);
    const [selectedDriverRide, setSelectedDriverRide] = useState(null);

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

            // Only admins can list all users, so we'll build user info from bookings/rides instead
            let allUsersList = [];
            if (currentUser.role === 'admin') {
                try {
                    allUsersList = await base44.entities.User.list();
                } catch (e) {
                    console.log("Could not list users - not admin");
                }
            }
            setAllUsers(allUsersList);

            const allRides = await base44.entities.Ride.list();
            setAllRidesData(allRides);
            const allBookings = await base44.entities.RideBooking.list();

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

            // Get rejected bookings for this rider (not yet dismissed)
            const riderRejectedBookings = allBookings.filter(b => 
                String(b.passenger_id) === String(currentUser.id) && 
                b.booking_status === 'rejected' &&
                !dismissedRejections.includes(b.id)
            );
            setRejectedBookings(riderRejectedBookings);

            // Active bookings: confirmed status with paid payment for both drivers and riders
            const userActiveBookings = allBookings.filter(b => {
                const isPassenger = String(b.passenger_id) === String(currentUser.id);
                const isDriver = String(b.driver_id) === String(currentUser.id);
                const isConfirmed = b.booking_status === 'confirmed';
                const isPaid = b.payment_status === 'paid';
                
                return (isPassenger || isDriver) && isConfirmed && isPaid;
            });

            const needsReview = [];
            const stillActive = [];

            // Get ratings once for efficiency
            const allRatings = await base44.entities.Rating.list();

            // Get current Hawaii time for comparison
            const hawaiiNow = getHawaiiNow();

            for (const booking of userActiveBookings) {
                const ride = allRides.find(r => String(r.id) === String(booking.id));

                if (ride) {
                    // Parse ride date/time as Hawaii local time
                    const rideDateTime = parseRideDateTimeHST(ride.departure_date, ride.departure_time);
                    // Add 4 hours buffer after departure time before requiring review
                    const reviewThreshold = rideDateTime.addHours(4);

                    const nowComparable = hawaiiNow.toComparable();
                    const thresholdComparable = reviewThreshold.toComparable();

                    if (nowComparable > thresholdComparable) {
                        // Check if current user needs to review the OTHER person in this booking
                        const isDriver = String(ride.driver_id) === String(currentUser.id);
                        const otherUserId = isDriver ? booking.passenger_id : ride.driver_id;

                        const userRating = allRatings.find(r => 
                            String(r.ride_id) === String(ride.id) && 
                            String(r.rated_by_user_id) === String(currentUser.id) &&
                            String(r.rated_user_id) === String(otherUserId)
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
                const isDriver = String(ride.driver_id) === String(currentUser.id);
                const otherUserId = isDriver ? booking.passenger_id : ride.driver_id;

                // Fetch user info for the review modal
                let otherUsername = isDriver 
                    ? (booking.passenger_username || booking.passenger_name) 
                    : (booking.driver_username || ride.driver_name);

                // Try to get actual username from user list if available
                if (allUsersList.length > 0) {
                    const otherUser = allUsersList.find(u => String(u.id) === String(otherUserId));
                    if (otherUser?.username) {
                        otherUsername = otherUser.username;
                    }
                }

                setCurrentReviewUser({ 
                    username: otherUsername, 
                    id: otherUserId 
                });
                setCurrentReviewRide(ride);
                setShowReviewModal(true);
            }

            const nowComparable = hawaiiNow.toComparable();
            
            // Rides where I'm the driver
            const myUpcomingRides = allRides.filter(r => {
                if (String(r.driver_id) !== String(currentUser.id)) return false;
                if (r.status !== 'active' && r.status !== 'full') return false;
                const rideDateTime = parseRideDateTimeHST(r.departure_date, r.departure_time);
                return rideDateTime.toComparable() >= nowComparable;
            });
            
            // Rides where I'm a confirmed passenger (from stillActive bookings)
            const myBookedRides = stillActive
                .filter(b => String(b.passenger_id) === String(currentUser.id))
                .map(b => allRides.find(r => r.id === b.ride_id))
                .filter(ride => {
                    if (!ride) return false;
                    const rideDateTime = parseRideDateTimeHST(ride.departure_date, ride.departure_time);
                    return rideDateTime.toComparable() >= nowComparable;
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

        // Send email notification to rider about rejection
        const riders = await base44.entities.User.list();
        const rider = riders.find(u => u.id === booking.passenger_id);
        if (rider?.email) {
            try {
                await base44.integrations.Core.SendEmail({
                    to: rider.email,
                    subject: `Ride request update - Cruise Kauaʻi`,
                    body: `
    Aloha ${booking.passenger_name},

    Unfortunately, the driver was unable to accept your ride request at this time. Your payment will be refunded.

    Please log into Cruise Kauaʻi to find another ride.

    Mahalo,
    Cruise Kauaʻi Team
                    `.trim()
                });
            } catch (emailError) {
                console.error("Error sending rejection email:", emailError);
            }
        }

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
        if (!confirm("Are you sure you want to cancel this ride request? Your payment will be refunded.")) return;
        
        try {
            await base44.entities.RideBooking.update(booking.id, {
                booking_status: 'cancelled',
                cancellation_reason: 'Cancelled by rider before acceptance',
                cancellation_date: new Date().toISOString()
            });

            // Notify driver that rider cancelled
            const drivers = await base44.entities.User.list();
            const driver = drivers.find(u => u.id === booking.driver_id);
            if (driver?.email) {
                try {
                    await base44.integrations.Core.SendEmail({
                        to: driver.email,
                        subject: `Ride request cancelled - Cruise Kauaʻi`,
                        body: `
Aloha ${driver.full_name},

${booking.passenger_name} has cancelled their ride request before you accepted it.

No action is needed on your end.

Mahalo,
Cruise Kauaʻi Team
                        `.trim()
                    });
                } catch (emailError) {
                    console.error("Error sending cancellation email to driver:", emailError);
                }
            }
            
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

    const handleDismissRejection = (bookingId) => {
        setDismissedRejections(prev => [...prev, bookingId]);
        setRejectedBookings(prev => prev.filter(b => b.id !== bookingId));
    };

    const handleOpenRiderCancelModal = (booking) => {
        setRiderBookingToCancel(booking);
        setShowRiderCancelModal(true);
    };

    const handleConfirmRiderCancel = async (booking, reason, refundPercentage) => {
        try {
            const ride = allRidesData.find(r => r.id === booking.ride_id);

            // Update booking status
            await base44.entities.RideBooking.update(booking.id, {
                booking_status: 'cancelled',
                cancellation_reason: reason,
                cancellation_date: new Date().toISOString()
            });

            // Restore seats on the ride
            if (ride) {
                await base44.entities.Ride.update(ride.id, {
                    seats_available: ride.seats_available + booking.seats_booked,
                    status: 'active'
                });
            }

            // Create admin notification for manual refund
            await base44.entities.AdminMessage.create({
                recipient_id: 'admin',
                recipient_name: 'Admin',
                subject: `Refund Request: ${refundPercentage} - ${booking.passenger_name}`,
                message: `
RIDER CANCELLATION - MANUAL REFUND NEEDED

Passenger: ${booking.passenger_name}
Booking ID: ${booking.id}
Ride: ${ride?.departure_location} → ${ride?.destination}
Date: ${ride?.departure_date} at ${ride?.departure_time}

Total Amount Paid: $${booking.total_amount?.toFixed(2)}
Refund Percentage: ${refundPercentage}
Cancellation Reason: ${reason}

Please process the refund manually via Stripe.
                `.trim(),
                message_type: 'action_required'
            });

            // Notify driver about cancellation
            const drivers = await base44.entities.User.list();
            const driver = drivers.find(u => u.id === booking.driver_id);
            if (driver?.email) {
                try {
                    await base44.integrations.Core.SendEmail({
                        to: driver.email,
                        subject: `Rider cancelled - Cruise Kauaʻi`,
                        body: `
Aloha ${driver.full_name},

${booking.passenger_name} has cancelled their confirmed booking for your ride on ${ride?.departure_date} at ${ride?.departure_time}.

Reason: ${reason}

The seat(s) have been made available again for your ride.

Mahalo,
Cruise Kauaʻi Team
                        `.trim()
                    });
                } catch (emailError) {
                    console.error("Error sending cancellation email to driver:", emailError);
                }
            }

            alert(`Booking cancelled. A ${refundPercentage} refund will be processed by our team.`);
            setShowRiderCancelModal(false);
            setRiderBookingToCancel(null);
            loadData();
        } catch (error) {
            console.error("Error cancelling booking:", error);
            alert("Error cancelling booking. Please try again.");
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
            // For drivers viewing passengers, use passenger info; for passengers viewing drivers, use driver info from booking
            const otherPartyUsername = otherUser?.username || (isDriver 
                ? (booking.passenger_username || booking.passenger_name) 
                : (booking.driver_username || allRidesData.find(r => r.id === booking.ride_id)?.driver_name || "Driver"));
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





                {/* Rejection Alert */}
                <RejectionAlert 
                    rejectedBookings={rejectedBookings}
                    onDismiss={handleDismissRejection}
                />

                {/* Pending Trips Card for Riders */}
                <PendingTripsCard
                    pendingBookings={myPendingBookings}
                    allRidesData={allRidesData}
                    getUserById={getUserById}
                    onCancelRequest={handleCancelPendingRequest}
                    onMessageDriver={handleMessageDriverFromPending}
                />

                {/* Admin Messages Card */}
                <AdminMessageCard
                    adminMessages={adminMessages}
                    onMessageRead={loadData}
                    onReplySuccess={loadData}
                />

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
                                const otherUsername = otherUser?.username || (isDriver 
                                    ? (booking.passenger_username || booking.passenger_name) 
                                    : (booking.driver_username || ride.driver_name));

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
                                    <button
                                        key={ride.id}
                                        onClick={() => {
                                            if (isDriver) {
                                                setSelectedDriverRide(ride);
                                                setShowDriverRideModal(true);
                                            }
                                        }}
                                        className={`w-full text-left bg-white rounded-lg p-4 border border-blue-200 ${isDriver ? 'hover:shadow-md cursor-pointer' : ''} transition-shadow`}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{format(new Date(ride.departure_date), "MMM d, yyyy")}</span>
                                                    <Clock className="w-4 h-4 ml-2" />
                                                    <span>{ride.departure_time}</span>
                                                </div>
                                                {isDriver && (
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                )}
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
                                                      // Find the booking for this ride to get driver username
                                                      const myBooking = activeBookings.find(b => 
                                                          String(b.ride_id) === String(ride.id) && 
                                                          String(b.passenger_id) === String(user?.id)
                                                      );
                                                      return myBooking?.driver_username || ride.driver_name || 'Driver';
                                                  })()}
                                              </p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
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
                                    // Use allRidesData to find ride details (not upcomingRides which may not include all rides)
                                    const ride = allRidesData.find(r => r.id === booking.ride_id);
                                    const otherPartyUsername = otherUser?.username || (isDriver 
                                        ? (booking.passenger_username || booking.passenger_name) 
                                        : (booking.driver_username || ride?.driver_name || "Driver"));
                                    const otherPartyPicture = otherUser?.profile_picture_url || '';

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
                                                                    onClick={() => handleOpenRiderCancelModal(booking)}
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

                <RiderCancelModal
                    isOpen={showRiderCancelModal}
                    onClose={() => {
                        setShowRiderCancelModal(false);
                        setRiderBookingToCancel(null);
                    }}
                    booking={riderBookingToCancel}
                    ride={riderBookingToCancel ? allRidesData.find(r => r.id === riderBookingToCancel.ride_id) : null}
                    onConfirmCancel={handleConfirmRiderCancel}
                />

                <DriverRideModal
                    isOpen={showDriverRideModal}
                    onClose={() => {
                        setShowDriverRideModal(false);
                        setSelectedDriverRide(null);
                    }}
                    ride={selectedDriverRide}
                    bookings={activeBookings}
                    onRideUpdated={loadData}
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