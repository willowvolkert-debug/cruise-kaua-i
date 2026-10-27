import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InquiryMessageBody from "@/components/admin/InquiryMessageBody";

export default function ContactInquiriesPanel({ inquiries, onRefresh }) {
  const [inquiryFilter, setInquiryFilter] = useState('pending');
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSendingResponse, setIsSendingResponse] = useState(false);

  const handleResolveInquiry = async (inquiryId) => {
    await base44.entities.ContactInquiry.update(inquiryId, { status: 'resolved' });
    onRefresh();
  };

  const handleRespondToInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    setResponseMessage('');
    setShowRespondModal(true);
  };

  const handleSendResponse = async () => {
    if (!selectedInquiry || !responseMessage.trim()) {
      alert('Please enter a response message.');
      return;
    }
    setIsSendingResponse(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: selectedInquiry.user_email,
        subject: `Re: ${selectedInquiry.subject} - Cruise Hawaiʻi Support`,
        body: `Aloha ${selectedInquiry.user_name},\n\nThank you for contacting us. We've responded to your inquiry:\n\n"${selectedInquiry.subject}"\n\n---\n\n${responseMessage}\n\n---\n\nYou can view this response in your Cruise Hawaiʻi inbox.\n\nMahalo,\nCruise Hawaiʻi Team`
      });
      await base44.entities.AdminMessage.create({
        recipient_id: selectedInquiry.user_id,
        recipient_name: selectedInquiry.user_name,
        recipient_email: selectedInquiry.user_email,
        subject: `Re: ${selectedInquiry.subject}`,
        message: responseMessage,
        message_type: 'info'
      });
      await base44.entities.ContactInquiry.update(selectedInquiry.id, { status: 'reviewed' });
      alert('Response sent successfully!');
      setShowRespondModal(false);
      setSelectedInquiry(null);
      setResponseMessage('');
      onRefresh();
    } catch (error) {
      console.error('Error sending response:', error);
      alert('Error sending response. Please try again.');
    }
    setIsSendingResponse(false);
  };

  const filtered = inquiries.filter(i => inquiryFilter === 'all' || i.status === inquiryFilter);

  return (
    <>
      <Card className="shadow-lg border-blue-300 bg-blue-50 rounded-3xl">
        <CardHeader>
          <CardTitle className="text-xl text-blue-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              contact inquiries ({inquiries.length})
            </div>
            <div className="flex gap-1 flex-wrap">
              {['all', 'pending', 'reviewed', 'resolved'].map(s => (
                <button
                  key={s}
                  onClick={() => setInquiryFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${inquiryFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border border-blue-300'}`}
                >
                  {s} ({s === 'all' ? inquiries.length : inquiries.filter(i => i.status === s).length})
                </button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-blue-700 text-sm text-center py-4">No inquiries with status "{inquiryFilter}".</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filtered.map(inquiry => (
                <div key={inquiry.id} className={`bg-white rounded-lg p-4 border ${
                  inquiry.status === 'pending' ? 'border-blue-200' :
                  inquiry.status === 'resolved' ? 'border-green-200' :
                  'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <p className="font-semibold text-secondary">{inquiry.subject}</p>
                        <Badge variant="outline" className={
                          inquiry.priority === 'high' ? 'bg-red-50 text-red-700 border-red-300' :
                          inquiry.priority === 'medium' ? 'bg-orange-50 text-orange-700 border-orange-300' :
                          'bg-gray-50 text-gray-700'
                        }>
                          {inquiry.priority}
                        </Badge>
                        <Badge variant="outline" className={
                          inquiry.status === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                          inquiry.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-300' :
                          'bg-gray-50 text-gray-700 border-gray-300'
                        }>
                          {inquiry.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{inquiry.message}</p>
                      <p className="text-xs text-gray-500">
                        From: {inquiry.user_name} ({inquiry.user_email}) · {new Date(inquiry.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        onClick={() => handleRespondToInquiry(inquiry)}
                        size="sm"
                        variant="outline"
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        respond
                      </Button>
                      {inquiry.status !== 'resolved' && (
                        <Button
                          onClick={() => handleResolveInquiry(inquiry.id)}
                          size="sm"
                          variant="outline"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Respond Modal */}
      <Dialog open={showRespondModal} onOpenChange={setShowRespondModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-secondary">respond to inquiry</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4 py-4 min-w-0">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <p className="font-semibold text-secondary mb-2">Original Inquiry:</p>
                <p className="text-sm text-gray-600 mb-1"><strong>From:</strong> {selectedInquiry.user_name} ({selectedInquiry.user_email})</p>
                <p className="text-sm text-gray-600 mb-1"><strong>Subject:</strong> {selectedInquiry.subject}</p>
                <div className="mt-2 p-3 bg-white rounded-lg">
                  <InquiryMessageBody message={selectedInquiry.message} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-semibold text-secondary">Your Response:</label>
                <Textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Type your response here..."
                  className="h-40 rounded-2xl resize-y w-full max-w-full"
                />
                <p className="text-xs text-gray-500">This will be sent via email and appear in the user's inbox.</p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => setShowRespondModal(false)} variant="outline" className="flex-1" disabled={isSendingResponse}>cancel</Button>
                <Button onClick={handleSendResponse} className="flex-1 bg-primary hover:bg-primary/90" disabled={isSendingResponse || !responseMessage.trim()}>
                  {isSendingResponse ? 'sending...' : 'send response'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}