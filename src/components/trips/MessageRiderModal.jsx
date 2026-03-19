import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { base44 } from "@/api/base44Client";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

export default function MessageRiderModal({ isOpen, onClose, request, onMessageSent }) {
  const [message, setMessage] = useState("Aloha! I can drive you. Book seats in my car using the find a ride feature in trips");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    try {
      setIsSending(true);
      const currentUser = await base44.auth.me();

      // Look up rider's email
      let riderEmail = '';
      try {
        const allUsers = await base44.entities.User.list();
        const rider = allUsers.find(u => u.id === request.rider_id);
        riderEmail = rider?.email || '';
      } catch (e) {
        console.error("Could not fetch rider email:", e);
      }
      
      // Find or create booking for messaging
      const bookings = await base44.entities.RideBooking.filter({
        passenger_id: request.rider_id,
        driver_id: currentUser.id
      });

      let booking;
      if (bookings.length > 0) {
        booking = bookings[0];
      } else {
        // Create a placeholder booking for messaging purposes
        booking = await base44.entities.RideBooking.create({
          ride_id: 'ride-request-' + request.id,
          driver_id: currentUser.id,
          driver_username: currentUser.username || currentUser.full_name,
          passenger_id: request.rider_id,
          passenger_name: request.rider_name,
          passenger_username: request.rider_username || request.rider_name,
          seats_booked: 1,
          total_amount: 0,
          booking_status: 'pending',
          description: 'Driver responded to ride request'
        });
      }

      // Add message to booking
      const updatedMessages = [
        ...(booking.messages || []),
        {
          sender_id: currentUser.id,
          sender_name: currentUser.full_name,
          message: message,
          timestamp: new Date().toISOString()
        }
      ];

      await base44.entities.RideBooking.update(booking.id, {
        messages: updatedMessages,
        booking_status: 'confirmed'
      });

      // Send email notification to rider
      try {
        const appUrl = 'https://ride-connect-b7a57d59.base44.app';
        await base44.integrations.Core.SendEmail({
          to: request.rider_email || '',
          subject: `🌺 A driver responded to your ride request on Cruise Kauaʻi!`,
          body: `
<html><body style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
<p>Aloha ${request.rider_name},</p>
<p>A driver has seen your ride request and sent you a message on Cruise Kauaʻi!</p>
<p style="background: #f5f5f5; padding: 16px; border-radius: 8px; font-style: italic;">"${message}"</p>
<p>Log in to the app to chat with them and book your ride: <a href="${appUrl}">${appUrl}</a></p>
<p>Mahalo,<br/>Cruise Kauaʻi Team</p>
</body></html>
          `.trim()
        });
      } catch (emailErr) {
        console.error("Error sending email to rider:", emailErr);
      }

      onMessageSent(request);
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-secondary">message this rider</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            message this rider to let them know your ride matches their request.
          </p>

          <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={request.rider_profile_picture_url} />
                <AvatarFallback className="bg-gradient-to-r from-primary to-green-400 text-white font-semibold">
                  {getInitials(request.rider_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-secondary">{request.rider_name}</p>
                {request.rider_username && (
                  <p className="text-sm text-gray-500">@{request.rider_username}</p>
                )}
              </div>
            </div>
            
            {request.rider_bio && (
              <p className="text-sm text-gray-600 italic">&quot;{request.rider_bio}&quot;</p>
            )}
            
            {(request.rider_age || request.rider_gender) && (
              <div className="flex gap-4 text-sm text-gray-600">
                {request.rider_age && <span>Age: {request.rider_age}</span>}
                {request.rider_gender && <span>Gender: {request.rider_gender}</span>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">your message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-2xl min-h-[100px]"
              placeholder="Type your message..."
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSend}
              disabled={isSending || !message.trim()}
              className="bg-primary hover:bg-primary/90 rounded-2xl"
            >
              {isSending ? (
                'sending...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  send
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}