import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, ShieldCheck, Loader2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { sendOnboardingEmail } from "@/functions/sendOnboardingEmail";

export default function LicenseVerificationModal({ isOpen, onClose, onSuccess }) {
  const [licenseFrontFile, setLicenseFrontFile] = useState(null);
  const [licenseBackFile, setLicenseBackFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!licenseFrontFile || !licenseBackFile) {
      setError("Please upload both front and back of your license.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const currentUser = await base44.auth.me();

      const [frontResult, backResult] = await Promise.all([
        base44.integrations.Core.UploadFile({ file: licenseFrontFile }),
        base44.integrations.Core.UploadFile({ file: licenseBackFile })
      ]);

      await base44.auth.updateMe({
        drivers_license_front_url: frontResult.file_url,
        drivers_license_back_url: backResult.file_url,
        drivers_license_pending_review: true,
        license_submitted_date: new Date().toISOString()
      });

      await base44.entities.UserEdit.create({
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        user_email: currentUser.email,
        change_type: "license",
        change_description: "Uploaded driver's license",
        old_values: {
          license_front_url: currentUser.drivers_license_front_url || null,
          license_back_url: currentUser.drivers_license_back_url || null
        },
        new_values: {
          license_front_url: frontResult.file_url,
          license_back_url: backResult.file_url
        }
      });

      await base44.entities.AdminMessage.create({
        recipient_id: 'admin',
        recipient_name: 'Admin',
        subject: `License Pending Review: ${currentUser.full_name}`,
        message: `A user has uploaded their driver's license for verification.\n\nUser: ${currentUser.full_name}\nEmail: ${currentUser.email}\n\nPlease review in the Admin Dashboard.`,
        message_type: 'action_required'
      });

      // Fire onboarding email (non-blocking)
      sendOnboardingEmail({}).catch(() => null);

      setIsUploading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setIsUploading(false);
      setError("Upload failed. Please try again. If the problem persists, contact us.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-5 w-5" />
        </button>

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary pr-8">verify license</DialogTitle>
          <DialogDescription className="text-gray-600">
            Upload clear photos of both sides of your driver's license. Your submission will be reviewed by our team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-700">{error}</div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isUploading || !licenseFrontFile || !licenseBackFile}
            className="w-full bg-primary hover:bg-primary/90 rounded-2xl"
          >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />uploading...</>
            ) : (
              <><ShieldCheck className="w-4 h-4 mr-2" />submit license</>
            )}
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">What you'll need:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• A valid driver's license</li>
              <li>• Clear, well-lit photos of both sides</li>
              <li>• All information must be readable</li>
            </ul>
          </div>

          <p className="text-xs text-gray-500 text-center">Your information is encrypted and secure.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}