import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, ShieldCheck } from "lucide-react";

const STRIPE_VERIFICATION_URL = "https://verify.stripe.com/start/live_YWNjdF8xU0M5NElMMkh0bzdtWXNpLF9UVmNNNlVmbWVjM1lKZXNqZ0VYSEJwVjFhMFpXdVly0100dUp8Bh0u";

export default function LicenseVerificationModal({ isOpen, onClose, onSuccess }) {
  const handleVerify = () => {
    window.open(STRIPE_VERIFICATION_URL, '_blank');
    onClose();
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

          <Button
            onClick={handleVerify}
            className="w-full px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            continue to verification
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Powered by Stripe Identity. Your information is encrypted and secure.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}