
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { X, CheckCircle, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const getInitials = (name = "") => name.split(' ').map(n => n[0]).join('').toUpperCase();

export default function ReportModal({ isOpen, onClose, recentChats }) {
  const [step, setStep] = useState('select-person'); // 'select-person', 'report-details', 'thank-you'
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [reportReasons, setReportReasons] = useState({
    unsafe_driving: false,
    feel_unsafe: false,
    unsafe_car: false,
    inappropriate_communication: false,
    something_else: false
  });
  const [reportDescription, setReportDescription] = useState('');
  const [additionalFeedback, setAdditionalFeedback] = useState('');

  const handlePersonSelect = (person) => {
    setSelectedPerson(person);
    setStep('report-details');
  };

  const handleReasonToggle = (reason) => {
    setReportReasons(prev => ({ ...prev, [reason]: !prev[reason] }));
  };

  const canSubmitReport = () => {
    const hasSelectedReason = Object.values(reportReasons).some(v => v);
    const hasDescription = reportDescription.trim().length > 0;
    return hasSelectedReason && hasDescription;
  };

  const handleReportSubmit = () => {
    if (!canSubmitReport()) return;
    
    // In production, this would send the report to the backend
    console.log('Report submitted:', {
      reported_person: selectedPerson,
      reasons: reportReasons,
      description: reportDescription
    });
    
    setStep('thank-you');
  };

  const handleFinalSubmit = () => {
    // In production, this would send additional feedback
    if (additionalFeedback.trim()) {
      console.log('Additional feedback:', additionalFeedback);
    }
    handleClose();
  };

  const handleClose = () => {
    setStep('select-person');
    setSelectedPerson(null);
    setReportReasons({
      unsafe_driving: false,
      feel_unsafe: false,
      unsafe_car: false,
      inappropriate_communication: false,
      something_else: false
    });
    setReportDescription('');
    setAdditionalFeedback('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {step === 'select-person' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-secondary">
                who would you like to report?
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4 max-h-96 overflow-y-auto">
              {recentChats && recentChats.length > 0 ? (
                recentChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handlePersonSelect(chat)}
                    className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="w-12 h-12 bg-gradient-to-r from-primary to-secondary">
                      <AvatarFallback className="text-white font-semibold">
                        {getInitials(chat.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-secondary">{chat.name}</p>
                      <p className="text-sm text-gray-500">{chat.tripDetails}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No recent chats available</p>
              )}
            </div>
          </>
        )}

        {step === 'report-details' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-secondary">
                what would you like to report?
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="unsafe_driving"
                    checked={reportReasons.unsafe_driving}
                    onCheckedChange={() => handleReasonToggle('unsafe_driving')}
                  />
                  <Label htmlFor="unsafe_driving" className="cursor-pointer">unsafe driving</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="feel_unsafe"
                    checked={reportReasons.feel_unsafe}
                    onCheckedChange={() => handleReasonToggle('feel_unsafe')}
                  />
                  <Label htmlFor="feel_unsafe" className="cursor-pointer">I feel unsafe</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="unsafe_car"
                    checked={reportReasons.unsafe_car}
                    onCheckedChange={() => handleReasonToggle('unsafe_car')}
                  />
                  <Label htmlFor="unsafe_car" className="cursor-pointer">unsafe car conditions</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="inappropriate_communication"
                    checked={reportReasons.inappropriate_communication}
                    onCheckedChange={() => handleReasonToggle('inappropriate_communication')}
                  />
                  <Label htmlFor="inappropriate_communication" className="cursor-pointer">Inappropriate communication</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="something_else"
                    checked={reportReasons.something_else}
                    onCheckedChange={() => handleReasonToggle('something_else')}
                  />
                  <Label htmlFor="something_else" className="cursor-pointer">something else</Label>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-secondary">please describe the situation in more detail</h4>
                <Textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please provide as much detail as possible..."
                  className="h-32"
                />
              </div>

              <Button
                onClick={handleReportSubmit}
                disabled={!canSubmitReport()}
                className="w-full bg-primary hover:bg-primary/90"
              >
                submit
              </Button>
            </div>
          </>
        )}

        {step === 'thank-you' && (
          <>
            <div className="space-y-6 py-8">
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-secondary text-center mb-2">
                  mahalo for keeping cruise kauaʻi safe for everyone
                </h3>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-secondary">
                  If you have any other feedback or concerns, please share here
                </h4>
                <Textarea
                  value={additionalFeedback}
                  onChange={(e) => setAdditionalFeedback(e.target.value)}
                  placeholder="Optional: Share any additional feedback..."
                  className="h-24"
                />
              </div>

              <Button
                onClick={handleFinalSubmit}
                className="w-full bg-primary hover:bg-primary/90"
              >
                submit
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
