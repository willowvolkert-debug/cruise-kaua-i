import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Send, CheckCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { confirmRecurringRide } from "@/functions/confirmRecurringRide";

export default function AdminMessageCard({ adminMessages = [], onMessageRead, onReplySuccess }) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [confirmingIds, setConfirmingIds] = useState({});
  const [confirmedIds, setConfirmedIds] = useState({});
  const [localMessages, setLocalMessages] = useState(adminMessages);

  // Update local state when prop changes
  React.useEffect(() => {
    setLocalMessages(adminMessages);
  }, [adminMessages]);

  const unreadMessages = localMessages.filter(m => !m.is_read);
  
  if (unreadMessages.length === 0) return null;

  const handleReply = async (msg) => {
    if (!replyMessage.trim()) return;
    
    setIsSending(true);
    try {
      // Get current user for email
      const currentUser = await base44.auth.me();

      // Create a contact inquiry for tracking (this is the main way to track replies)
      await base44.entities.ContactInquiry.create({
        user_id: msg.recipient_id,
        user_name: msg.recipient_name,
        user_email: currentUser?.email || msg.recipient_email || '',
        subject: `Reply: ${msg.subject}`,
        message: replyMessage,
        status: 'pending',
        priority: 'medium'
      });

      // Mark the original message as read
      await base44.entities.AdminMessage.update(msg.id, { is_read: true });

      // Remove from local state
      setLocalMessages(prev => prev.filter(m => m.id !== msg.id));

      alert("Reply sent successfully!");
      setReplyMessage('');
      setReplyingTo(null);
      if (onReplySuccess) onReplySuccess();
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Error sending reply: " + error.message);
    }
    setIsSending(false);
  };

  const handleMarkAsRead = async (msg) => {
    try {
      await base44.entities.AdminMessage.update(msg.id, { is_read: true });
      setLocalMessages(prev => prev.filter(m => m.id !== msg.id));
      if (onMessageRead) onMessageRead();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Parse recurring ride confirmation URL from message text
  const parseConfirmationUrl = (message) => {
    const match = message?.match(/https:\/\/cruisekauai\.org\/ConfirmRide\?schedule_id=([^&\s]+)&date=([^&\s]+)&trip_name=([^&\s]+)/);
    if (match) {
      return { schedule_id: decodeURIComponent(match[1]), date: decodeURIComponent(match[2]), trip_name: decodeURIComponent(match[3]) };
    }
    return null;
  };

  const handleConfirmRide = async (msg, confirmationData) => {
    setConfirmingIds(prev => ({ ...prev, [msg.id]: true }));
    try {
      await confirmRecurringRide({ schedule_id: confirmationData.schedule_id, date: confirmationData.date });
      setConfirmedIds(prev => ({ ...prev, [msg.id]: true }));
      // Auto mark as read after 2 seconds
      setTimeout(async () => {
        await handleMarkAsRead(msg);
      }, 2000);
    } catch (error) {
      console.error("Error confirming ride:", error);
      alert("Error confirming ride. Please try again.");
    }
    setConfirmingIds(prev => ({ ...prev, [msg.id]: false }));
  };

  return (
    <Card className="shadow-lg border-red-400 bg-red-50 rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          !Admin Message! ({unreadMessages.length} unread)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {unreadMessages.map(msg => (
          <div 
            key={msg.id} 
            className={`p-4 rounded-2xl border ${
              !msg.is_read 
                ? 'bg-white border-red-300'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-bold text-secondary">{msg.subject}</p>
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
                  {(() => {
                    const confData = parseConfirmationUrl(msg.message);
                    if (confData) {
                      const cleanMessage = msg.message.replace(/\n*Tap here to confirm: https:\/\/cruisekauai\.org\/ConfirmRide\?[^\s]+/, '');
                      const isConfirmed = confirmedIds[msg.id];
                      const isConfirming = confirmingIds[msg.id];
                      return (
                        <div>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap mb-3">{cleanMessage}</p>
                          {isConfirmed ? (
                            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                              <CheckCircle className="w-4 h-4" /> Ride confirmed!
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleConfirmRide(msg, confData)}
                              disabled={isConfirming}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white rounded-2xl"
                            >
                              {isConfirming ? (
                                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Confirming...</>
                              ) : (
                                <><CheckCircle className="w-4 h-4 mr-1" /> Confirm Ride</>
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    }
                    return <p className="text-gray-700 text-sm whitespace-pre-wrap">{msg.message}</p>;
                  })()}
                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(msg.created_date), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              {/* Reply Section */}
              {replyingTo === msg.id ? (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="rounded-2xl"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyMessage('');
                      }}
                      variant="outline"
                      size="sm"
                      className="rounded-2xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleReply(msg)}
                      disabled={isSending || !replyMessage.trim()}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 rounded-2xl"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      {isSending ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => setReplyingTo(msg.id)}
                    variant="outline"
                    size="sm"
                    className="rounded-2xl border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    Reply
                  </Button>
                  {!msg.is_read && (
                    <Button
                      onClick={() => handleMarkAsRead(msg)}
                      variant="outline"
                      size="sm"
                      className="rounded-2xl border-gray-300"
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}