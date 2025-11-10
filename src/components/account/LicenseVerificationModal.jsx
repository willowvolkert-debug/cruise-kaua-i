
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Camera, X, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LicenseVerificationModal({ isOpen, onClose, onSuccess }) {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFrontImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFrontImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFrontPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!frontImage || !backImage) {
      alert("Please upload both front and back photos of your driver's license.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload front image
      const { file_url: frontUrl } = await base44.integrations.Core.UploadFile({ file: frontImage });
      
      // Upload back image
      const { file_url: backUrl } = await base44.integrations.Core.UploadFile({ file: backImage });
      
      // Update user with license photos and pending review status
      await base44.auth.updateMe({
        drivers_license_front_url: frontUrl,
        drivers_license_back_url: backUrl,
        drivers_license_pending_review: true,
        drivers_license_verified: false
      });

      setSubmitted(true);
      
      // Notify admin (in production, this would send an email/notification)
      console.log("ADMIN NOTIFICATION: New driver's license verification pending review");
      
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
      
    } catch (error) {
      console.error("Error uploading license:", error);
      alert("Error uploading license. Please try again.");
    }
    
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setFrontImage(null);
    setBackImage(null);
    setFrontPreview(null);
    setBackPreview(null);
    setSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>

        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-secondary pr-8">
                verify your driver's license
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <p className="text-sm text-gray-600">
                Please upload clear photos of the front and back of your driver's license. 
                Your information will be manually reviewed by our team for verification.
              </p>

              {/* Front Image */}
              <div className="space-y-2">
                <Label htmlFor="front">front of license *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary transition-colors">
                  {frontPreview ? (
                    <div className="relative">
                      <img src={frontPreview} alt="License front" className="w-full h-48 object-contain rounded" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFrontImage(null);
                          setFrontPreview(null);
                        }}
                        className="absolute top-2 right-2"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="front" className="flex flex-col items-center justify-center cursor-pointer py-8">
                      <Camera className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click to upload front photo</span>
                      <Input
                        id="front"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFrontImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Back Image */}
              <div className="space-y-2">
                <Label htmlFor="back">back of license *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary transition-colors">
                  {backPreview ? (
                    <div className="relative">
                      <img src={backPreview} alt="License back" className="w-full h-48 object-contain rounded" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBackImage(null);
                          setBackPreview(null);
                        }}
                        className="absolute top-2 right-2"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="back" className="flex flex-col items-center justify-center cursor-pointer py-8">
                      <Camera className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click to upload back photo</span>
                      <Input
                        id="back"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleBackImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !frontImage || !backImage}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'submitting...' : 'submit for verification'}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="space-y-6 py-8 text-center">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-secondary mb-2">
                submission successful!
              </h3>
              <p className="text-gray-600">
                Your driver's license is now pending review. We'll notify you once it's verified.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
