import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, X, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

const detectPhoneNumber = (text) => {
  // Regex patterns for phone numbers
  const patterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // 123-456-7890 or 123.456.7890 or 1234567890
    /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g, // (123) 456-7890
    /\b\d{3}\s+\d{3}\s+\d{4}\b/g, // 123 456 7890
  ];
  
  return patterns.some(pattern => pattern.test(text));
};

export default function ChatModal({ isOpen, onClose, booking, otherPartyName, otherPartyPicture }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPhoneWarning, setShowPhoneWarning] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!isOpen || !booking) return;
      
      setIsLoading(true);
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        // Load messages from booking
        setMessages(booking.messages || []);
        
        // Check if phone number was already detected
        if (booking.phone_number_detected) {
          setShowPhoneWarning(true);
        }
      } catch (error) {
        console.error("Error loading chat data:", error);
      }
      setIsLoading(false);
    };

    loadData();
  }, [isOpen, booking]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    // Check for phone numbers
    const hasPhoneNumber = detectPhoneNumber(newMessage);
    
    if (hasPhoneNumber && !booking.phone_number_detected) {
      // Flag this booking for admin review
      await base44.entities.RideBooking.update(booking.id, {
        phone_number_detected: true
      });
      setShowPhoneWarning(true);
    }

    const messageObj = {
      sender_id: currentUser.id,
      sender_name: currentUser.full_name,
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, messageObj];
    setMessages(updatedMessages);
    setNewMessage('');

    // Update booking with new message
    try {
      await base44.entities.RideBooking.update(booking.id, {
        messages: updatedMessages
      });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherPartyPicture} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                {getInitials(otherPartyName)}
              </AvatarFallback>
            </Avatar>
            @{otherPartyName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-8 text-center">Loading chat...</div>
        ) : (
          <div className="space-y-4">
            {showPhoneWarning && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  <strong>Reminder:</strong> Please keep all communication within the app. Do not share phone numbers or other contact information for your safety.
                </AlertDescription>
              </Alert>
            )}

            {/* Messages */}
            <div className="h-80 overflow-y-auto space-y-3 p-4 bg-muted/30 rounded-lg">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</p>
              ) : (
                messages.map((msg, index) => {
                  const isCurrentUser = msg.sender_id === currentUser?.id;
                  return (
                    <div key={index} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-lg p-3 ${
                        isCurrentUser 
                          ? 'bg-primary text-white' 
                          : 'bg-white border border-border'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${isCurrentUser ? 'text-white/70' : 'text-gray-500'}`}>
                          {format(new Date(msg.timestamp), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}