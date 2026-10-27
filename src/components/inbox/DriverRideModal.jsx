import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, MapPin, Users, DollarSign, Edit, X, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { sendBookingEmail } from "@/functions/sendBookingEmail";
import { toast } from "@/components/ui/use-toast";

// Helper to convert 24-hour time to 12-hour format with AM/PM
const formatTime12Hour = (timeStr) => {
    if (!timeStr) return '';
    if (/AM|PM/i.test(timeStr)) return timeStr;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export default function DriverRideModal({ isOpen, onClose, ride, bookings = [], onRideUpdated }) {
    const [isEditing, setIsEditing] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [editData, setEditData] = useState({});
    const [pickupPoints, setPickupPoints] = useState({});

    const confirmedBookings = bookings.filter(b => 
        b.ride_id === ride?.id && b.booking_status === 'confirmed'
    );
    const hasRiders = confirmedBookings.length > 0;

    useEffect(() => {
        if (ride) {
            // Initialize pickup points from existing booking data
            const points = {};
            bookings.filter(b => b.ride_id === ride?.id && b.booking_status === 'confirmed').forEach(b => {
                points[b.id] = b.pickup_point || '';
            });
            setPickupPoints(points);
            setEditData({
                departure_location: ride.departure_location || '',
                destination: ride.destination || '',
                departure_date: ride.departure_date || '',
                departure_time: ride.departure_time || '',
                seats_available: ride.seats_available || 1,
                price_per_seat_local: ride.price_per_seat_local || ride.price_per_seat || 0,
                price_per_seat_tourist: ride.price_per_seat_tourist || ride.price_per_seat || 0,
                description: ride.description || '',
                smoking_allowed: ride.smoking_allowed || false,
                pets_allowed: ride.pets_allowed || false,
                offers_detour_service: ride.offers_detour_service || false
            });
        }
    }, [ride]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await base44.entities.Ride.update(ride.id, editData);
            setIsEditing(false);
            if (onRideUpdated) onRideUpdated();
        } catch (error) {
            console.error("Error updating ride:", error);
            alert("Error updating ride. Please try again.");
        }
        setIsSaving(false);
    };

    const handleCancelRide = async () => {
        setIsCancelling(true);
        try {
            if (hasRiders) {
                // Refund all riders and mark bookings as cancelled
                for (const booking of confirmedBookings) {
                    await base44.entities.RideBooking.update(booking.id, {
                        booking_status: 'cancelled',
                        cancellation_reason: 'Driver cancelled the ride',
                        cancellation_date: new Date().toISOString()
                    });

                    // Send email notification to rider
                    try {
                        await sendBookingEmail({
                            userId: booking.passenger_id,
                            subject: `Ride Cancelled - Cruise Hawaiʻi`,
                            body: `Aloha ${booking.passenger_name},\n\nUnfortunately, the driver has cancelled the ride scheduled for ${format(new Date(ride.departure_date), "EEE, MMM d, yyyy")} at ${formatTime12Hour(ride.departure_time)}.\n\nRoute: ${ride.departure_location} → ${ride.destination}\n\nA full refund will be processed to your original payment method.\n\nWe apologize for any inconvenience. Please log into Cruise Hawaiʻi to find another ride.\n\nMahalo,\nCruise Hawaiʻi Team`
                        });
                    } catch (emailError) {
                        console.error("Error sending cancellation email:", emailError);
                    }
                }

                // Create admin notification for refunds
                await base44.entities.AdminMessage.create({
                    recipient_id: 'admin',
                    recipient_name: 'Admin',
                    subject: `Driver Cancelled Ride - Refunds Needed`,
                    message: `
                    DRIVER CANCELLED RIDE - MANUAL REFUNDS NEEDED

                    Driver: ${ride.driver_name}
                    Ride: ${ride.departure_location} → ${ride.destination}
                    Date: ${format(new Date(ride.departure_date + 'T12:00:00'), "EEE, MMM d, yyyy")} at ${formatTime12Hour(ride.departure_time)}

Affected Riders:
${confirmedBookings.map(b => `- ${b.passenger_name}: $${b.total_amount?.toFixed(2)}`).join('\n')}

Please process full refunds for all affected riders.
                    `.trim(),
                    message_type: 'action_required'
                });
            }

            // Cancel the ride
            await base44.entities.Ride.update(ride.id, {
                status: 'cancelled'
            });

            // Send confirmation email to the driver who cancelled
            try {
                await sendBookingEmail({
                    userId: ride.driver_id,
                    subject: `Your ride is cancelled - Cruise Hawaiʻi`,
                    body: `Aloha ${ride.driver_name},\n\nYour ride from ${ride.departure_location} → ${ride.destination} on ${format(new Date(ride.departure_date + 'T12:00:00'), "EEE, MMM d, yyyy")} at ${formatTime12Hour(ride.departure_time)} has been cancelled.\n\n${hasRiders ? `All ${confirmedBookings.length} confirmed rider(s) have been notified and will receive full refunds.\n\n` : ''}Mahalo,\nCruise Hawaiʻi Team`
                });
            } catch (emailError) {
                console.error("Error sending cancellation confirmation email to driver:", emailError);
            }

            toast({ title: "ride cancelled ✓", description: hasRiders ? "Riders have been notified and refunds will be processed." : "Your ride has been cancelled.", duration: 5000 });
            setShowCancelConfirm(false);
            onClose();
            if (onRideUpdated) onRideUpdated();
        } catch (error) {
            console.error("Error cancelling ride:", error);
            toast({ variant: "destructive", title: "couldn't cancel", description: "Something went wrong. Please try again.", duration: 5000 });
        }
        setIsCancelling(false);
    };

    if (!ride) return null;

    return (
        <>
            <Dialog open={isOpen && !showCancelConfirm} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl">
                    <DialogHeader className="flex flex-row items-center justify-between">
                        <DialogTitle className="text-2xl font-bold text-secondary">
                            ride details
                        </DialogTitle>
                        {!hasRiders && !isEditing && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                className="text-primary hover:text-primary/80"
                            >
                                <Edit className="w-4 h-4 mr-1" />
                                edit
                            </Button>
                        )}
                        {isEditing && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                                className="text-gray-500"
                            >
                                <X className="w-4 h-4 mr-1" />
                                cancel
                            </Button>
                        )}
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {hasRiders && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-800 text-sm">
                                <strong>Note:</strong> This ride has {confirmedBookings.length} confirmed rider(s) and cannot be edited.
                            </div>
                        )}

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Departure Location</Label>
                                    <Input
                                        value={editData.departure_location}
                                        onChange={(e) => setEditData({...editData, departure_location: e.target.value})}
                                        className="rounded-2xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Destination</Label>
                                    <Input
                                        value={editData.destination}
                                        onChange={(e) => setEditData({...editData, destination: e.target.value})}
                                        className="rounded-2xl"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input
                                            type="date"
                                            value={editData.departure_date}
                                            onChange={(e) => setEditData({...editData, departure_date: e.target.value})}
                                            className="rounded-2xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Time</Label>
                                        <Input
                                            type="time"
                                            value={editData.departure_time}
                                            onChange={(e) => setEditData({...editData, departure_time: e.target.value})}
                                            className="rounded-2xl"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Seats Available</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="8"
                                            value={editData.seats_available}
                                            onChange={(e) => setEditData({...editData, seats_available: parseInt(e.target.value)})}
                                            className="rounded-2xl"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Local Price ($)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={editData.price_per_seat_local}
                                                onChange={(e) => setEditData({...editData, price_per_seat_local: parseFloat(e.target.value)})}
                                                className="rounded-2xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tourist Price ($)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={editData.price_per_seat_tourist}
                                                onChange={(e) => setEditData({...editData, price_per_seat_tourist: parseFloat(e.target.value)})}
                                                className="rounded-2xl"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={editData.description}
                                        onChange={(e) => setEditData({...editData, description: e.target.value})}
                                        className="rounded-2xl"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Smoking Allowed</Label>
                                        <Switch
                                            checked={editData.smoking_allowed}
                                            onCheckedChange={(v) => setEditData({...editData, smoking_allowed: v})}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Pets Allowed</Label>
                                        <Switch
                                            checked={editData.pets_allowed}
                                            onCheckedChange={(v) => setEditData({...editData, pets_allowed: v})}
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full bg-primary hover:bg-primary/90 rounded-2xl"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>{ride.departure_date ? format(new Date(ride.departure_date + 'T12:00:00'), "EEE, MMM d, yyyy") : 'TBD'}</span>
                                    <Clock className="w-4 h-4 ml-2" />
                                    <span>{formatTime12Hour(ride.departure_time)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    <span className="font-semibold text-secondary text-lg">
                                        {ride.departure_location} → {ride.destination}
                                    </span>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-500" />
                                        <span>{ride.seats_available} seats available</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-gray-500" />
                                        <span>Local: ${ride.price_per_seat_local || ride.price_per_seat || 0} per seat</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-gray-500" />
                                        <span>Tourist: ${ride.price_per_seat_tourist || ride.price_per_seat || 0} per seat</span>
                                    </div>
                                </div>

                                {ride.description && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Description</p>
                                        <p className="text-gray-700">{ride.description}</p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    {ride.smoking_allowed && (
                                        <Badge variant="outline" className="rounded-2xl">Smoking OK</Badge>
                                    )}
                                    {ride.pets_allowed && (
                                        <Badge variant="outline" className="rounded-2xl">Pets OK</Badge>
                                    )}
                                </div>

                                {confirmedBookings.length > 0 && (
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                                        <p className="font-semibold text-green-800 mb-2">Confirmed Riders ({confirmedBookings.length})</p>
                                        <div className="space-y-3">
                                            {confirmedBookings.map(b => (
                                                <div key={b.id} className="space-y-1.5">
                                                    <p className="text-sm text-green-700 font-medium">
                                                        • {b.passenger_name} ({b.seats_booked} seat{b.seats_booked > 1 ? 's' : ''})
                                                    </p>
                                                    <div className="flex items-center gap-2 pl-4">
                                                        <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                                        <Input
                                                            type="text"
                                                            placeholder="set pickup point (e.g., 'front of Lihue Airport')"
                                                            value={pickupPoints[b.id] || ''}
                                                            onChange={(e) => setPickupPoints(prev => ({ ...prev, [b.id]: e.target.value }))}
                                                            onBlur={async () => {
                                                                try {
                                                                    await base44.entities.RideBooking.update(b.id, { pickup_point: pickupPoints[b.id] || '' });
                                                                    toast({ title: "pickup point saved ✓", duration: 3000 });
                                                                } catch (err) {
                                                                    toast({ variant: "destructive", title: "couldn't save pickup point", duration: 3000 });
                                                                }
                                                            }}
                                                            className="rounded-xl h-9 text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {!isEditing && (
                            <Button
                                onClick={() => setShowCancelConfirm(true)}
                                variant="outline"
                                className="w-full border-red-300 text-red-600 hover:bg-red-50 rounded-2xl"
                            >
                                Cancel Ride
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cancel Confirmation Modal */}
            <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
                <DialogContent className="sm:max-w-md bg-white rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6" />
                            {hasRiders ? 'Cancel Ride with Riders?' : 'Cancel This Ride?'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        {hasRiders ? (
                            <>
                                <p className="text-gray-700">
                                    Are you sure you want to cancel? This will:
                                </p>
                                <ul className="list-disc list-inside text-gray-600 space-y-2">
                                    <li>Send full refunds to all {confirmedBookings.length} rider(s)</li>
                                    <li>Notify all affected riders via email</li>
                                    <li>Show up in your reviews that you cancelled your ride</li>
                                </ul>
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl text-orange-800 text-sm">
                                    <strong>Affected riders:</strong>
                                    {confirmedBookings.map(b => (
                                        <p key={b.id}>• {b.passenger_name} - ${b.total_amount?.toFixed(2)} refund</p>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-700">
                                Are you sure you want to cancel this ride? It will no longer be visible to riders.
                            </p>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={() => setShowCancelConfirm(false)}
                                variant="outline"
                                className="flex-1 rounded-2xl"
                            >
                                Keep Ride
                            </Button>
                            <Button
                                onClick={handleCancelRide}
                                disabled={isCancelling}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-2xl"
                            >
                                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Ride'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}