import { getIsland } from "@/lib/island";
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageSquare, Star, Bell, Clock, AlertTriangle, ChevronRight, UserPlus, MapPin, Calendar, RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import TripReviewModal from "@/components/rating/TripReviewModal";
import useTripReviewPrompt from "@/components/rating/useTripReviewPrompt";
import getPendingTripReviews from "@/components/rating/getPendingTripReviews";
import ReportModal from "../components/inbox/ReportModal";
import ChatModal from "../components/inbox/ChatModal";
import RiderRequestModal from "../components/inbox/RiderRequestModal";
import CancelBookingModal from "../components/rides/CancelBookingModal";
import PendingTripsCard from "../components/inbox/PendingTripsCard";
import RejectionAlert from "../components/inbox/RejectionAlert";
import RiderCancelModal from "../components/inbox/RiderCancelModal";
import AdminMessageCard from "../components/inbox/AdminMessageCard";
import DriverRideModal from "../components/inbox/DriverRideModal";

import { Link as RouterLink } from "react-router-dom";

import { format } from "date-fns";
import { formatHST } from "@/lib/formatHST";
import { sendNotification } from "../components/utils/notifications";
import { sendBookingEmail } from "../functions/sendBookingEmail";
import { getHawaiiNow, parseRideDateTimeHST, parseDateString, formatTime12Hour } from "@/lib/hstHelpers";
import { toast } from "@/components/ui/use-toast";

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
    const [showRiderCancelModal, setShowRiderCancelModal] = useState(false);
    const [riderBookingToCancel, setRiderBookingToCancel] = useState(null);
    const [rejectedBookings, setRejectedBookings] = useState([]);
    const [dismissedRejections, setDismissedRejections] = useState([]);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [allRidesData, setAllRidesData] = useState([]);
    const [adminMessages, setAdminMessages] = useState([]);
    const [showDriverRideModal, setShowDriverRideModal] = useState(false);
    const [selectedDriverRide, setSelectedDriverRide] = useState(null);

    // Wrap loadData in useCallback so the pull-to-refresh hook can use it
    // as a stable dependency without re-subscribing on every render.
    const refreshFn = useCallback(async () => {
        await loadData();
    }, []);

    const { pullDistance, isRefreshing } = usePullToRefresh({ onRefresh: refreshFn });

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

            // Fetch bookings where user is driver and where user is passenger separately
            // with a high limit so pending requests are never cut off by default pagination
            const [driverBookings, passengerBookings] = await Promise.all([
                base44.entities.RideBooking.filter({driver_id: currentUser.id}, '-created_date', 500),
                base44.entities.RideBooking.filter({passenger_id: currentUser.id}, '-created_date', 500)
            ]);

            // Merge, deduplicate by booking id
            const bookingMap = new Map();
            [...driverBookings, ...passengerBookings].forEach(b => bookingMap.set(b.id, b));
            const rawBookings = Array.from(bookingMap.values());

            // Collect all ride IDs we need to fetch (exclude ride-request reply bookings)
            const myBookingRideIds = rawBookings
                .map(b => b.ride_id)
                .filter(id => id && !id.startsWith('ride-request-'));

            // Fetch my own rides (as driver) + rides referenced in my bookings (as passenger)
            const [myOwnRides, ...bookingRideResults] = await Promise.all([
                base44.entities.Ride.filter({driver_id: currentUser.id}, '-created_date', 500),
                ...myBookingRideIds.map(id => base44.entities.Ride.get(id).catch(() => null))
            ]);

            // Merge, deduplicate
            const rideMap = new Map();
            [...myOwnRides, ...bookingRideResults].forEach(r => { if (r) rideMap.set(r.id, r); });
            // Islands are separate silos: only this island's rides and bookings
            const island = getIsland();
            const allRides = Array.from(rideMap.values()).filter(r => (r.island || 'Kauai') === island);
            const islandRideIds = new Set(allRides.map(r => r.id));
            const allBookings = rawBookings.filter(b => islandRideIds.has(b.ride_id) || String(b.ride_id).startsWith('ride-request-'));
            setAllRidesData(allRides);

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
            // Also include ride-request reply bookings (confirmed, total_amount=0, ride_id starts with 'ride-request-')
            const userActiveBookings = allBookings.filter(b => {
                const isPassenger = String(b.passenger_id) === String(currentUser.id);
                const isDriver = String(b.driver_id) === String(currentUser.id);
                const isConfirmed = b.booking_status === 'confirmed';
                const isPaid = b.payment_status === 'paid';
                const isRideRequestReply = isConfirmed && b.total_amount === 0 && b.ride_id?.startsWith('ride-request-');
                
                return (isPassenger || isDriver) && isConfirmed && (isPaid || isRideRequestReply);
            });

            const hawaiiNow = getHawaiiNow();
            const needsReview = await getPendingTripReviews(allBookings, allRides, currentUser.id);
            const stillActive = userActiveBookings.filter(booking => {
                const ride = allRides.find(r => String(r.id) === String(booking.ride_id));
                if (!ride) return true;
                return ride.status !== 'completed' && hawaiiNow.toComparable() <=
                    parseRideDateTimeHST(ride.departure_date, ride.departure_time).addHours(4).toComparable();
            });
            setRidesNeedingReview(needsReview);
            setActiveBookings(stillActive);

            const nowComparable = hawaiiNow.toComparable();
            
            // Rides where I'm the driver (only future rides)
            const myUpcomingRides = allRides.filter(r => {
                if (String(r.driver_id) !== String(currentUser.id)) return false;
                if (r.status !== 'active' && r.status !== 'full') return false;
                const rideDateTime = parseRideDateTimeHST(r.departure_date, r.departure_time);
                // Ride must be in the future (not past departure time)
                return rideDateTime.toComparable() > nowComparable;
            });

            // Rides where I'm a confirmed passenger (from stillActive bookings, only future rides)
            const myBookedRides = stillActive
                .filter(b => String(b.passenger_id) === String(currentUser.id))
                .map(b => allRides.find(r => r.id === b.ride_id))
                .filter(ride => {
                    if (!ride) return false;
                    const rideDateTime = parseRideDateTimeHST(ride.departure_date, ride.departure_time);
                    // Ride must be in the future (not past departure time)
                    return rideDateTime.toComparable() > nowComparable;
                });
            
            const uniqueUpcomingRides = Array.from(new Set([...myUpcomingRides, ...myBookedRides].map(ride => ride.id)))
                .map(id => [...myUpcomingRides, ...myBookedRides].find(ride => ride.id === id));

            // Sort chronologically by date and time
            const sortedUpcomingRides = uniqueUpcomingRides.sort((a, b) => {
                const aDateTime = parseRideDateTimeHST(a.departure_date, a.departure_time);
                const bDateTime = parseRideDateTimeHST(b.departure_date, b.departure_time);
                return aDateTime.toComparable() - bDateTime.toComparable();
            });

            setUpcomingRides(sortedUpcomingRides);

            // Load admin messages for this user (filtered server-side)
            const myAdminMessages = await base44.entities.AdminMessage.filter({ recipient_id: currentUser.id }, '-created_date');
            setAdminMessages(myAdminMessages);

        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    };

    const { review, openReview, closeReview } = useTripReviewPrompt(ridesNeedingReview, user?.id, loadData);

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

            // Preserve existing messages (seeded at payment time), only add initial if none exist
            const existingMessages = booking.messages || [];
            const updateData = { booking_status: 'confirmed' };
            if (existingMessages.length === 0 && booking.description) {
                updateData.messages = [{
                    sender_id: booking.passenger_id,
                    sender_name: booking.passenger_name,
                    message: booking.description,
                    timestamp: new Date().toISOString()
                }];
            }

            await base44.entities.RideBooking.update(booking.id, updateData);

            if (ride) {
                const updatedSeats = ride.seats_available - booking.seats_booked;
                await base44.entities.Ride.update(ride.id, {
                    seats_available: updatedSeats,
                    status: updatedSeats <= 0 ? 'full' : 'active'
                });
            }

            // Send confirmation email to rider
            try {
                await sendBookingEmail({
                    userId: booking.passenger_id,
                    subject: `🎉 Your ride request was accepted!`,
                    body: `Hi ${booking.passenger_name},\n\nGreat news! Your ride request has been accepted by the driver.\n\nTrip Details:\n${ride ? `${ride.departure_location} → ${ride.destination}\nDate: ${ride.departure_date}\nTime: ${ride.departure_time}` : ''}\n\nPlease log into Cruise Hawaiʻi to chat with your driver.\n\nMahalo,\nCruise Hawaiʻi Team`
                });
            } catch (emailError) {
                console.error("Error sending confirmation email:", emailError);
            }

            // Browser notification for driver
            sendNotification(
                'Ride Request Accepted!',
                `${booking.passenger_name} can now join your trip.`
            );

            toast({ title: "booking confirmed ✓", description: `${booking.passenger_name} has been notified and can now join your trip.`, duration: 5000 });
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
        try {
            await sendBookingEmail({
                userId: booking.passenger_id,
                subject: `Ride request update - Cruise Hawaiʻi`,
                body: `Aloha ${booking.passenger_name},\n\nUnfortunately, the driver was unable to accept your ride request at this time. Your payment will be refunded.\n\nPlease log into Cruise Hawaiʻi to find another ride.\n\nMahalo,\nCruise Hawaiʻi Team`
            });
        } catch (emailError) {
            console.error("Error sending rejection email:", emailError);
        }

        sendNotification(
            'Ride Request Rejected',
            'A rider request has been declined.'
        );

        toast({ title: "request declined", description: `${booking.passenger_name} has been notified and will receive a refund.`, duration: 5000 });
        setShowRiderRequestModal(false);
        loadData();
    } catch (error) {
        console.error("Error rejecting request:", error);
        alert("Error rejecting request. Please try again.");
    }
    };

    const handleRequestFullPrice = async (booking) => {
        try {
            await base44.entities.RideBooking.update(booking.id, {
                price_offer_status: 'driver_requesting_full'
            });

            // Notify rider via in-app message
            await base44.entities.AdminMessage.create({
                recipient_id: booking.passenger_id,
                recipient_name: booking.passenger_name,
                subject: '💰 Driver response to your price offer',
                message: `The driver has reviewed your price offer of $${booking.offered_price}/seat and is requesting you pay the original price request instead. Please log in to the app to respond — you can either accept and pay the difference, or your current payment will be refunded.`,
                message_type: 'action_required'
            });

            // Send email to rider
            try {
                await sendBookingEmail({
                    userId: booking.passenger_id,
                    subject: `The driver wants the full price - Cruise Hawaiʻi`,
                    body: `Aloha ${booking.passenger_name},\n\nThe driver has reviewed your price offer of $${booking.offered_price}/seat and is requesting the original price request for this ride.\n\nPlease log into Cruise Hawaiʻi to review the request. If you don't respond, your payment will be refunded.\n\nhttps://cruisehi.org/home\n\nMahalo,\nCruise Hawaiʻi Team`
                });
            } catch (emailError) {
                console.error("Error sending full price request email:", emailError);
            }

            // Browser notification
            sendNotification('Price Offer Response', 'The driver is requesting the original price.');

            toast({ title: "rider notified ✓", description: `Asked ${booking.passenger_name} to pay the full price instead of their offer.`, duration: 5000 });
            setShowRiderRequestModal(false);
            loadData();
        } catch (error) {
            console.error("Error requesting full price:", error);
            alert("Error sending response. Please try again.");
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
            try {
                await sendBookingEmail({
                    userId: booking.driver_id,
                    subject: `Ride request cancelled - Cruise Hawaiʻi`,
                    body: `Aloha,\n\n${booking.passenger_name} has cancelled their ride request before you accepted it.\n\nNo action is needed on your end.\n\nMahalo,\nCruise Hawaiʻi Team`
                });
            } catch (emailError) {
                console.error("Error sending cancellation email to driver:", emailError);
            }
            // Send confirmation email to the rider who cancelled
            try {
                await sendBookingEmail({
                    userId: booking.passenger_id,
                    subject: `Your ride request is cancelled - Cruise Hawaiʻi`,
                    body: `Aloha ${booking.passenger_name},\n\nYour ride request has been cancelled.\n\nYour payment will be refunded.\n\nMahalo,\nCruise Hawaiʻi Team`
                });
            } catch (emailError) {
                console.error("Error sending cancellation confirmation email to rider:", emailError);
            }

            toast({ title: "request cancelled ✓", description: "Your ride request was cancelled and your payment will be refunded.", duration: 5000 });
            loadData();
        } catch (error) {
            console.error("Error cancelling request:", error);
            toast({ variant: "destructive", title: "couldn't cancel", description: "Something went wrong. Please try again.", duration: 5000 });
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
            try {
                await sendBookingEmail({
                    userId: booking.driver_id,
                    subject: `Rider cancelled - Cruise Hawaiʻi`,
                    body: `Aloha,\n\n${booking.passenger_name} has cancelled their confirmed booking for your ride on ${ride?.departure_date ? format(parseDateString(ride.departure_date), "EEE, MMM d, yyyy") : 'TBD'} at ${ride?.departure_time ? formatTime12Hour(ride.departure_time) : 'TBD'}.\n\nReason: ${reason}\n\nThe seat(s) have been made available again for your ride.\n\nMahalo,\nCruise Hawaiʻi Team`
                });
            } catch (emailError) {
                console.error("Error sending cancellation email to driver:", emailError);
            }
            // Send confirmation email to the rider who cancelled
            try {
                await sendBookingEmail({
                    userId: booking.passenger_id,
                    subject: `Your cancellation is confirmed - Cruise Hawaiʻi`,
                    body: `Aloha ${booking.passenger_name},\n\nYour booking for the ride from ${ride?.departure_location} → ${ride?.destination} on ${ride?.departure_date ? format(parseDateString(ride.departure_date), "EEE, MMM d, yyyy") : 'TBD'} at ${ride?.departure_time ? formatTime12Hour(ride.departure_time) : 'TBD'} has been cancelled.\n\nReason: ${reason}\n\nRefund: ${refundPercentage} of your payment will be processed.\n\nMahalo,\nCruise Hawaiʻi Team`
                });
            } catch (emailError) {
                console.error("Error sending cancellation confirmation email to rider:", emailError);
            }

            toast({ title: "cancellation confirmed ✓", description: `A ${refundPercentage} refund will be processed by our team.`, duration: 5000 });
            setShowRiderCancelModal(false);
            setRiderBookingToCancel(null);
            loadData();
        } catch (error) {
            console.error("Error cancelling booking:", error);
            toast({ variant: "destructive", title: "couldn't cancel", description: "Something went wrong. Please try again.", duration: 5000 });
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
                    payer_name: "Cruise Hawaiʻi (Refund)",
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

            toast({ title: "booking cancelled ✓", description: `${refundPercentage === 1 ? 'Full refund' : refundPercentage === 0.5 ? '50% refund' : 'No refund'} processed.`, duration: 5000 });
            setShowCancelModal(false);
            loadData();
        } catch (error) {
            console.error("Error cancelling booking:", error);
            toast({ variant: "destructive", title: "couldn't cancel", description: "Something went wrong. Please try again.", duration: 5000 });
        }
    };

    const getUserById = (userId) => {
        return allUsers.find(u => u.id === userId);
    };

    // Include pending paid bookings too so chat appears immediately after payment (for both rider and driver)
    const allChattableBookings = [
        ...activeBookings,
        ...(myPendingBookings || []),
        ...(pendingRequests || [])
    ].filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i); // dedupe

    const recentChats = allChattableBookings
        .filter(booking => {
            // Always show pending paid bookings so the chat is accessible right after payment
            if (booking.booking_status === 'pending' && booking.payment_status === 'paid') return true;
            if (!booking.messages || booking.messages.length === 0) return false;
            // Ride-request reply bookings always show (no real ride attached)
            if (booking.ride_id?.startsWith('ride-request-')) return true;
            // Check if ride is within 3 days after departure
            const ride = allRidesData.find(r => r.id === booking.ride_id);
            if (!ride) return true; // Show if ride not found
            const rideDateTime = parseRideDateTimeHST(ride.departure_date, ride.departure_time);
            const threeDaysAfterRide = rideDateTime.addHours(72); // 3 days = 72 hours
            const hawaiiNow = getHawaiiNow();
            return hawaiiNow.toComparable() <= threeDaysAfterRide.toComparable();
        })
        .map(booking => {
            const isDriver = String(user?.id) === String(booking.driver_id);
            const otherUserId = isDriver ? booking.passenger_id : booking.driver_id;
            const otherUser = getUserById(otherUserId);
            const otherPartyUsername = otherUser?.username || (isDriver 
                ? (booking.passenger_username || booking.passenger_name) 
                : (booking.driver_username || allRidesData.find(r => r.id === booking.ride_id)?.driver_name || "Driver"));
            const otherPartyPicture = otherUser?.profile_picture_url || '';
            const lastMessage = booking.messages && booking.messages.length > 0 
                ? booking.messages[booking.messages.length - 1] 
                : null;
            return {
                id: booking.id,
                name: otherPartyUsername,
                picture: otherPartyPicture,
                lastMessage: lastMessage?.message || 'Tap to start the conversation',
                timestamp: lastMessage?.timestamp || booking.created_date,
                booking: booking
            };
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return (
        <div className="p-4 md:p-8 bg-white">
            {/* Pull-to-refresh indicator */}
            {(pullDistance > 0 || isRefreshing) && (
                <div
                    className="flex items-center justify-center text-primary transition-opacity"
                    style={{ height: `${pullDistance}px`, opacity: pullDistance > 0 ? 1 : 0 }}
                >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </div>
            )}
            <div className="max-w-4xl mx-auto space-y-6">
                <a href="/home" className="inline-flex items-center gap-1 text-primary-foreground bg-primary hover:bg-primary/90 font-bold text-base rounded-full pl-2 pr-4 py-2 select-none">
                    <span aria-hidden>‹</span> back
                </a>
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="cruise-head text-4xl text-secondary leading-none">inbox</h1>
                        <p className="text-gray-900 text-lg mt-1">chat with riders & drivers and leave ratings</p>
                    </div>
                    <Button
                        onClick={() => setShowReportModal(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shrink-0"
                        size="sm"
                    >
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        report
                    </Button>
                </div>



                {/* Rides Needing Review */}
                {ridesNeedingReview.length > 0 && (
                    <Card className="shadow-none border-0 border-b-2 border-gray-200 bg-white rounded-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl font-heading tracking-widest text-secondary">
                                <Star className="w-6 h-6 text-orange-500" />
                                leave a review ({ridesNeedingReview.length})
                            </CardTitle>
                            <p className="text-sm text-orange-700">your recent trips are waiting for a review!</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {ridesNeedingReview.map(({ booking, ride }) => {
                                const isDriver = String(ride.driver_id) === String(user?.id);
                                const otherUsername = isDriver
                                    ? (booking.passenger_username || booking.passenger_name)
                                    : (booking.driver_username || ride.driver_name);
                                return (
                                    <div key={booking.id} className="bg-white rounded-xl p-4 border border-orange-200">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 mb-1">
                                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(parseDateString(ride.departure_date), "MM/dd/yyyy")}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            <span className="font-semibold text-secondary">{ride.departure_location} → {ride.destination}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">trip with @{otherUsername}</p>
                                        <Button
                                            onClick={() => openReview(booking, ride)}
                                            className="w-full bg-primary hover:bg-primary/90 rounded-2xl"
                                        >
                                            <Star className="w-4 h-4 mr-1" /> leave review for @{otherUsername}
                                        </Button>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                {/* Rejection Alert */}
                <RejectionAlert 
                    rejectedBookings={rejectedBookings}
                    onDismiss={handleDismissRejection}
                />



                {/* Admin Messages Card */}
                <AdminMessageCard
                    adminMessages={adminMessages}
                    onMessageRead={loadData}
                    onReplySuccess={loadData}
                />

                {pendingRequests.length > 0 && (
                    <Card className="shadow-none border-0 border-b-2 border-gray-200 bg-white rounded-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl font-heading tracking-widest text-secondary">
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
                                        className="w-full flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-300"
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
                                               <div className="flex gap-1 mt-1 flex-wrap">
                                                   <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 rounded-2xl">
                                                       Pending
                                                   </Badge>
                                                   {request.is_price_offer && request.offered_price && (
                                                       <Badge className="bg-amber-100 text-amber-800 border-amber-300 rounded-2xl">
                                                           💰 price offer: ${request.offered_price}/seat
                                                       </Badge>
                                                   )}
                                               </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Combined Recent Messages card (includes active trip context) */}
                <Card className="shadow-none border-0 border-b-2 border-gray-200 bg-white rounded-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl font-heading tracking-widest text-secondary">
                            <MessageSquare className="w-6 h-6 text-primary"/>
                            recent messages
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentChats.length > 0 ? (
                            <div className="space-y-3">
                                {recentChats.map((chat) => {
                                    const ride = allRidesData.find(r => r.id === chat.booking.ride_id);
                                    return (
                                        <button
                                            key={chat.id}
                                            onClick={() => handleOpenChat(chat.booking, chat.name, chat.picture)}
                                            className="w-full flex items-start gap-4 p-4 bg-white rounded-lg border-2 border-gray-300 text-left"
                                        >
                                            <Avatar className="w-11 h-11 shrink-0">
                                                <AvatarImage src={chat.picture} />
                                                <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white font-semibold">
                                                    {getInitials(chat.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                    <p className="font-semibold text-secondary">@{chat.name}</p>
                                                    <p className="text-xs text-gray-400 shrink-0">
                                                        {formatHST(chat.timestamp, "MMM d, h:mm a")} HST
                                                    </p>
                                                </div>
                                                {ride && (
                                                    <p className="text-xs text-primary font-medium flex items-center gap-1 mb-1">
                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                        {ride.departure_location} → {ride.destination}
                                                        <span className="text-gray-400 font-normal ml-1">· {format(parseDateString(ride.departure_date), "MM/dd/yyyy")}</span>
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">
                                None yet! Book a trip for messages to appear here.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Alert className="bg-teal-50 border-primary/50 text-secondary rounded-2xl">
                    <Bot className="h-5 w-5 text-primary" />
                    <AlertTitle className="font-bold">chatbot safety monitor</AlertTitle>
                    <AlertDescription>
                        Our AI chatbot monitors all messages to ensure no personal contact information is shared. 
                        Keep all communication within the app.
                    </AlertDescription>
                </Alert>

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
                    onRequestFullPrice={handleRequestFullPrice}
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

                <TripReviewModal review={review} userId={user?.id} onClose={closeReview} onSaved={loadData} />
            </div>
        </div>
    );
}