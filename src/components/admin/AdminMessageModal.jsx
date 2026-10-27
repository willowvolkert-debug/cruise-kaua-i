import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AdminMessageModal({ isOpen, onClose, user, onSuccess }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      alert("Please fill in both subject and message.");
      return;
    }

    setIsSending(true);
    try {
      await base44.entities.AdminMessage.create({
        recipient_id: user.id,
        recipient_name: user.full_name,
        recipient_email: user.email,
        subject: subject.trim(),
        message: message.trim(),
        message_type: messageType,
        is_read: false
      });

      // Also send email notification
      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `Cruise Hawaiʻi: ${subject}`,
          body: `
Aloha ${user.full_name},

You have a new message from the Cruise Hawaiʻi team:

${message}

Please log into your Cruise Hawaiʻi account and check your Inbox for more details.

Mahalo,
Cruise Hawaiʻi Team
          `.trim()
        });
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
      }

      alert("Message sent successfully!");
      setSubject('');
      setMessage('');
      setMessageType('info');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message. Please try again.");
    }
    setIsSending(false);
  };

  const handleClose = () => {
    setSubject('');
    setMessage('');
    setMessageType('info');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-secondary">
            message user
          </DialogTitle>
        </DialogHeader>

        {user && (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-gray-50 rounded-2xl">
              <p className="font-medium text-secondary">{user.full_name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>

            <div className="space-y-2">
              <Label>message type</Label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="action_required">Action Required</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>subject *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Issue with your license verification"
                className="rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>message *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain what the user needs to know or do..."
                className="h-32 rounded-2xl"
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={isSending || !subject.trim() || !message.trim()}
              className="w-full bg-primary hover:bg-primary/90 rounded-2xl"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? 'sending...' : 'send message'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}