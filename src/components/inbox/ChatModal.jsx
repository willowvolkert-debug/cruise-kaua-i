import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, X, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

const detectPhoneNumber = (text) => {
  const patterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g,
    /\b\d{3}\s+\d{3}\s+\d{4}\b/g,
  ];
  return patterns.some(pattern => pattern.test(text));
};

export default function ChatModal({ isOpen, onClose, booking, otherPartyName, otherPartyPicture }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPhoneWarning, setShowPhoneWarning] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadData = async () => {
      if (!isOpen || !booking) return;
      setIsLoading(true);
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        const msgs = booking.messages || [];
        setMessages(msgs);
        if (booking.phone_number_detected) setShowPhoneWarning(true);

        // Mark all current messages as read for this user
        if (msgs.length > 0) {
          const readCounts = booking.read_message_counts || {};
          readCounts[user.id] = msgs.length;
          await base44.entities.RideBooking.update(booking.id, { read_message_counts: readCounts });
        }
      } catch (error) {
        console.error("Error loading chat data:", error);
      }
      setIsLoading(false);
    };
    loadData();
  }, [isOpen, booking]);

  // Scroll to bottom after loading
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => scrollToBottom(), 50);
    }
  }, [isLoading]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    const hasPhoneNumber = detectPhoneNumber(newMessage);
    if (hasPhoneNumber) setShowPhoneWarning(true);

    const messageObj = {
      sender_id: currentUser.id,
      sender_name: currentUser.full_name,
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, messageObj];
    setMessages(updatedMessages);
    setNewMessage('');

    try {
      const updatePayload = { messages: updatedMessages };
      if (hasPhoneNumber && !booking.phone_number_detected) {
        updatePayload.phone_number_detected = true;
      }
      await base44.entities.RideBooking.update(booking.id, updatePayload);

      const isDriver = currentUser.id === booking.driver_id;
      const otherUserId = isDriver ? booking.passenger_id : booking.driver_id;

      const otherUsers = await base44.entities.User.filter({ id: otherUserId });
      if (otherUsers && otherUsers.length > 0) {
        const otherUser = otherUsers[0];
        if (otherUser.email) {
          const senderName = `@${currentUser.username || currentUser.full_name}`;
          const preview = `${newMessage.substring(0, 200)}${newMessage.length > 200 ? '...' : ''}`;
          try {
            await base44.integrations.Core.SendEmail({
              to: otherUser.email,
              subject: `💬 New message from ${senderName} - Cruise Kauaʻi`,
              body: `<html><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;max-width:600px;margin:0 auto;padding:24px;">
<div style="text-align:center;margin-bottom:24px;">
  <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Kauaʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;" />
  <p style="margin:8px 0 0 0;font-weight:bold;color:#2d6a4f;font-size:15px;">Cruise Kauaʻi</p>
</div>
<p>Aloha ${otherUser.full_name || ''},</p>
<p>You have a new message from <strong>${senderName}</strong>:</p>
<div style="background:#f3f4f6;border-left:4px solid #2d6a4f;border-radius:4px;padding:16px;margin:16px 0;">
  <p style="margin:0;font-size:15px;">"${preview}"</p>
</div>
<p style="margin-top:24px;">
  <a href="https://www.cruisekauai.org/Inbox" style="background-color:#2d6a4f;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Reply in App →</a>
</p>
<p style="margin-top:32px;">Mahalo,<br/><strong>Cruise Kauaʻi Team</strong></p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;">
<p style="font-size:12px;color:#999;">Replies to this email are not monitored. Please use the app to respond.</p>
</body></html>`
            });
          } catch (emailError) {
            console.error("Error sending message email:", emailError);
          }
          if (otherUser.sms_notifications_enabled && otherUser.phone_number) {
            try {
              await base44.functions.invoke('sendSmsNotification', {
                userId: otherUser.id,
                message: `Cruise Kauaʻi: New message from ${senderName}: "${preview.substring(0, 100)}${preview.length > 100 ? '...' : ''}" — log in to reply`
              });
            } catch (smsError) {
              console.error("Error sending SMS:", smsError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={otherPartyPicture} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
            {getInitials(otherPartyName)}
          </AvatarFallback>
        </Avatar>
        <p className="font-bold text-secondary text-lg flex-1 truncate">@{otherPartyName}</p>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">Loading chat...</div>
        ) : (
          <>
            {showPhoneWarning && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800 text-sm">
                  <strong>Reminder:</strong> Please keep all communication within the app. Do not share phone numbers for your safety.
                </AlertDescription>
              </Alert>
            )}
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-center">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isCurrentUser = msg.sender_id === currentUser?.id;
                return (
                  <div key={index} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      isCurrentUser
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 rounded-bl-sm shadow-sm'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                      <p className={`text-xs mt-1 ${isCurrentUser ? 'text-white/70' : 'text-gray-400'}`}>
                        {format(new Date(msg.timestamp), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 px-4 py-3 bg-white border-t border-gray-200">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 rounded-full text-base"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          className="bg-primary hover:bg-primary/90 rounded-full w-11 h-11 p-0 shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}