import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { messageRideRequester } from "@/functions/messageRideRequester";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

export default function MessageRiderModal({ isOpen, onClose, request, onMessageSent }) {
  const [message, setMessage] = useState("Aloha! I can drive you. Book seats in my car using the find a ride feature in trips");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    try {
      setIsSending(true);
      const currentUser = await base44.auth.me();

      await messageRideRequester({
        rider_id: request.rider_id,
        rider_name: request.rider_name,
        rider_username: request.rider_username,
        request_id: request.id,
        message
      });

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