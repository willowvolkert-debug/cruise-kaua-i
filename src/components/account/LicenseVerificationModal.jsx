import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { X, ExternalLink, ShieldCheck, Loader2, Upload, CreditCard } from "lucide-react";
import { createIdentityVerification } from "@/functions/createIdentityVerification";
import { base44 } from "@/api/base44Client";

export default function LicenseVerificationModal({ isOpen, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [licenseFrontFile, setLicenseFrontFile] = useState(null);
  const [licenseBackFile, setLicenseBackFile] = useState(null);
  const [isUploadingManual, setIsUploadingManual] = useState(false);

  const handleStripeVerify = async () => {
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
                message: `A user has submitted their driver's license for verification via Stripe Identity.\n\nUser: ${currentUser.full_name}\nEmail: ${currentUser.email}\n\nPlease review in the Admin Dashboard and check the Stripe Identity Dashboard for verification details.`,
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

  const handleManualUpload = async () => {
    if (!licenseFrontFile || !licenseBackFile) {
      setError("Please upload both front and back of your license.");
      return;
    }

    setIsUploadingManual(true);
    setError(null);

    try {
      const currentUser = await base44.auth.me();

      // Upload license files
      const [frontResult, backResult] = await Promise.all([
        base44.integrations.Core.UploadFile({ file: licenseFrontFile }),
        base44.integrations.Core.UploadFile({ file: licenseBackFile })
      ]);

      // Update user with license URLs and mark as pending review
      await base44.auth.updateMe({
        drivers_license_front_url: frontResult.file_url,
        drivers_license_back_url: backResult.file_url,
        drivers_license_pending_review: true,
        license_submitted_date: new Date().toISOString()
      });

      // Log the license edit
      await base44.entities.UserEdit.create({
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        user_email: currentUser.email,
        change_type: "license",
        change_description: "Uploaded driver's license (manual)",
        old_values: {
          license_front_url: currentUser.drivers_license_front_url || null,
          license_back_url: currentUser.drivers_license_back_url || null
        },
        new_values: {
          license_front_url: frontResult.file_url,
          license_back_url: backResult.file_url
        }
      });

      // Notify admin
      await base44.entities.AdminMessage.create({
        recipient_id: 'admin',
        recipient_name: 'Admin',
        subject: `License Pending Review: ${currentUser.full_name}`,
        message: `A user has manually uploaded their driver's license for verification.\n\nUser: ${currentUser.full_name}\nEmail: ${currentUser.email}\n\nPlease review in the Admin Dashboard.`,
        message_type: 'action_required'
      });

      setIsUploadingManual(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Manual upload error:", err);
      setError("Failed to upload license. Please try again.");
      setIsUploadingManual(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary pr-8">
            verify license
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            We prefer to verify licenses through Stripe. If Stripe verification is not working, you can manually upload your license below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stripe Identity Option */}
          <Card 
            className="p-4 border-2 border-primary/20 hover:border-primary/40 cursor-pointer transition-all"
            onClick={handleStripeVerify}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Stripe Identity Verification</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Quick and secure verification through Stripe's trusted platform. Recommended for faster approval.
                </p>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStripeVerify();
                  }}
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 rounded-2xl"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      creating session...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      verify with stripe
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Manual Upload Option */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px bg-gray-300 flex-1"></div>
              <span className="text-sm text-gray-500">or upload manually</span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="license-front">Front of License *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center hover:border-primary/40 transition-colors">
                  <input
                    id="license-front"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLicenseFrontFile(e.target.files[0])}
                    className="hidden"
                  />
                  <label htmlFor="license-front" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {licenseFrontFile ? licenseFrontFile.name : "Click to upload front"}
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license-back">Back of License *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center hover:border-primary/40 transition-colors">
                  <input
                    id="license-back"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLicenseBackFile(e.target.files[0])}
                    className="hidden"
                  />
                  <label htmlFor="license-back" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {licenseBackFile ? licenseBackFile.name : "Click to upload back"}
                    </span>
                  </label>
                </div>
              </div>

              <Button
                onClick={handleManualUpload}
                disabled={isUploadingManual || !licenseFrontFile || !licenseBackFile}
                className="w-full bg-gray-700 hover:bg-gray-800 rounded-2xl"
              >
                {isUploadingManual ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    submit license
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">What you'll need:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• A valid driver's license or government ID</li>
              <li>• Clear, well-lit photos of both sides</li>
              <li>• All information must be readable</li>
            </ul>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your information is encrypted and secure.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}