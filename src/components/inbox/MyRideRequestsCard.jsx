import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, Users, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";

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
    // Parse date string in local time to avoid timezone issues
    return new Date(dateStr + 'T00:00:00');
};

export default function MyRideRequestsCard({ myRequests, onRequestUpdated }) {
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);

    if (!myRequests || myRequests.length === 0) return null;

    const handleEdit = (request) => {
        setEditingRequest(request);
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        // This will be handled by the parent component
        setShowEditModal(false);
        setEditingRequest(null);
        if (onRequestUpdated) onRequestUpdated();
    };

    const handleCancel = async (request) => {
        if (!confirm('Are you sure you want to cancel this ride request?')) return;
        // This will be handled by the parent component
        if (onRequestUpdated) onRequestUpdated(request, 'cancel');
    };

    return (
        <>
            <Card className="shadow-lg border-purple-200 bg-purple-50 rounded-3xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-secondary">
                        <Users className="w-6 h-6 text-purple-600" />
                        my ride requests ({myRequests.length})
                    </CardTitle>
                    <p className="text-sm text-purple-700">
                        manage your posted ride requests below
                    </p>
                </CardHeader>
                <CardContent className="space-y-3">
                    {myRequests.map(request => (
                        <div key={request.id} className="bg-white rounded-lg p-4 border border-purple-200">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>{format(parseDateString(request.departure_date), "EEE, MMM d, yyyy")}</span>
                                    <Clock className="w-4 h-4 ml-2" />
                                    <span>{formatTime12Hour(request.departure_time)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <span className="font-semibold text-secondary">
                                        {request.departure_location} → {request.destination}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {request.seats_needed} seat{request.seats_needed > 1 ? 's' : ''} needed
                                    {request.has_luggage && ' • Has luggage'}
                                </p>
                                {request.description && (
                                    <p className="text-sm text-gray-500 italic">{request.description}</p>
                                )}
                                <Badge variant="outline" className="rounded-2xl bg-purple-50 text-purple-700 border-purple-300">
                                    {request.status}
                                </Badge>
                                <div className="flex gap-2 mt-3">
                                    <Button
                                        onClick={() => handleEdit(request)}
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 rounded-2xl border-purple-300 text-purple-600 hover:bg-purple-50"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() => handleCancel(request)}
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 rounded-2xl border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {editingRequest && (
                <EditRequestModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingRequest(null);
                    }}
                    request={editingRequest}
                    onSave={handleSaveEdit}
                />
            )}
        </>
    );
}

function EditRequestModal({ isOpen, onClose, request, onSave }) {
    const [formData, setFormData] = React.useState({
        departure_location: request.departure_location,
        destination: request.destination,
        departure_date: request.departure_date,
        departure_time: request.departure_time,
        seats_needed: request.seats_needed,
        is_flexible: request.is_flexible,
        has_luggage: request.has_luggage,
        description: request.description
    });

    const handleSubmit = async () => {
        try {
            await base44.entities.RideRequest.update(request.id, formData);
            alert('Ride request updated successfully!');
            onSave();
        } catch (error) {
            console.error('Error updating request:', error);
            alert('Failed to update ride request. Please try again.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white rounded-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-secondary">
                        edit ride request
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Coming From</Label>
                        <Input
                            value={formData.departure_location}
                            onChange={(e) => setFormData({ ...formData, departure_location: e.target.value })}
                            className="rounded-2xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Going To</Label>
                        <Input
                            value={formData.destination}
                            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                            className="rounded-2xl"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={formData.departure_date}
                                onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                                className="rounded-2xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Time</Label>
                            <Input
                                value={formData.departure_time}
                                onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                                placeholder="e.g., 9:00 AM"
                                className="rounded-2xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Seats Needed</Label>
                        <Input
                            type="number"
                            min="1"
                            max="8"
                            value={formData.seats_needed}
                            onChange={(e) => setFormData({ ...formData, seats_needed: parseInt(e.target.value) })}
                            className="rounded-2xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Why do you need this ride?"
                            className="rounded-2xl h-24"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label>Flexible Time</Label>
                        <Switch
                            checked={formData.is_flexible}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_flexible: checked })}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label>Has Luggage</Label>
                        <Switch
                            checked={formData.has_luggage}
                            onCheckedChange={(checked) => setFormData({ ...formData, has_luggage: checked })}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={onClose} variant="outline" className="rounded-2xl">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} className="bg-primary rounded-2xl">
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}