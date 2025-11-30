import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, ShieldCheck, Loader2 } from "lucide-react";
import { createIdentityVerification } from "@/functions/createIdentityVerification";
import { base44 } from "@/api/base44Client";

export default function LicenseVerificationModal({ isOpen, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await createIdentityVerification({});
      
      if (response.data?.error) {
        setError(response.data.error);
        setIsLoading(false);
        return;
      }
      
      if (response.data?.url) {
        // Open Stripe Identity verification in a popup window
        const width = 500;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          response.data.url,
          'stripe-identity-verification',
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );

        // Poll to check when popup closes
        const checkPopup = setInterval(async () => {
          if (!popup || popup.closed) {
            clearInterval(checkPopup);
            setIsLoading(false);
            
            // Notify admin of new license submission
            try {
              const currentUser = await base44.auth.me();
              await base44.entities.AdminMessage.create({
                recipient_id: 'admin',
                recipient_name: 'Admin',
                subject: `License Pending Review: ${currentUser.full_name}`,
                message: `A user has submitted their driver's license for verification.\n\nUser: ${currentUser.full_name}\nEmail: ${currentUser.email}\n\nPlease review in the Admin Dashboard and check the Stripe Identity Dashboard for verification details.`,
                message_type: 'action_required'
              });
            } catch (notifyErr) {
              console.error("Error notifying admin:", notifyErr);
            }
            
            if (onSuccess) onSuccess();
            onClose();
          }
        }, 500);
      } else {
        setError("Failed to create verification session. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(err?.response?.data?.error || "Failed to start verification. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary pr-8">
            verify your driver's license
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-12 h-12 text-primary" />
            </div>
          </div>

          <p className="text-sm text-gray-600 text-center">
            To verify your identity, you'll be redirected to Stripe's secure verification portal. 
            This helps keep our community safe and trusted.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">What you'll need:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• A valid driver's license or government ID</li>
              <li>• A device with a camera</li>
              <li>• Good lighting for clear photos</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            onClick={handleVerify}
            disabled={isLoading}
            className="w-full px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                creating session...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                continue to verification
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Powered by Stripe Identity. Your information is encrypted and secure.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}