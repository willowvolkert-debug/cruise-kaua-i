import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Car, Save, ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { createConnectAccount } from "@/functions/createConnectAccount";
import { sendOnboardingEmail } from "@/functions/sendOnboardingEmail";
import { useDraftSave, loadDraft, clearDraft } from "@/hooks/useDraftSave";

const VEHICLE_DRAFT_KEY = 'draft_vehicle_details';

export default function VehicleDetailsPage() {
  const _vDraft = loadDraft(VEHICLE_DRAFT_KEY);
  const [vehicleData, setVehicleData] = useState({
    make: _vDraft?.make || '',
    model: _vDraft?.model || '',
    year: _vDraft?.year || '',
    color: _vDraft?.color || '',
    license_plate: _vDraft?.license_plate || '',
    seats_available: _vDraft?.seats_available || 4,
    bags_allowed: _vDraft?.bags_allowed !== undefined ? _vDraft.bags_allowed : true,
    vehicle_exterior_image: null,
    vehicle_interior_images: [],
    auto_policy_image: null
  });

  // Auto-save text/select fields (not file objects which can't be serialized)
  const vehicleDataForDraft = { make: vehicleData.make, model: vehicleData.model, year: vehicleData.year, color: vehicleData.color, license_plate: vehicleData.license_plate, seats_available: vehicleData.seats_available, bags_allowed: vehicleData.bags_allowed };
  useDraftSave(VEHICLE_DRAFT_KEY, vehicleDataForDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [user, setUser] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [isCreatingStripe, setIsCreatingStripe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.vehicle_make) {
          // Only overwrite fields that aren't already in the local draft
          setVehicleData(prev => ({
            make: prev.make || currentUser.vehicle_make || '',
            model: prev.model || currentUser.vehicle_model || '',
            year: prev.year || currentUser.vehicle_year || '',
            color: prev.color || currentUser.vehicle_color || '',
            license_plate: prev.license_plate || currentUser.license_plate || '',
            seats_available: prev.seats_available || currentUser.seats_available || 4,
            bags_allowed: prev.bags_allowed !== undefined ? prev.bags_allowed : (currentUser.bags_allowed !== undefined ? currentUser.bags_allowed : true),
            vehicle_exterior_image: null,
            vehicle_interior_images: [],
            auto_policy_image: null
          }));
        }
      } catch (e) {
        console.error("Error loading user:", e);
      }
    };
    loadUser();
  }, []);

  const handleInputChange = (field, value) => {
    setVehicleData(prev => ({ ...prev, [field]: value }));
  };

  const handleExteriorImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVehicleData(prev => ({ ...prev, vehicle_exterior_image: file }));
    }
  };

  const handleInteriorImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setVehicleData(prev => ({ ...prev, vehicle_interior_images: files }));
    }
  };

  const handlePolicyImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVehicleData(prev => ({ ...prev, auto_policy_image: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadError('');
    setUploadProgress('');

    if (!vehicleData.vehicle_exterior_image && !user?.vehicle_exterior_photo_url) {
      setUploadError("Please upload a photo of the outside of your vehicle.");
      setIsSubmitting(false);
      return;
    }

    if (vehicleData.vehicle_interior_images.length === 0 && !user?.vehicle_interior_photo_urls?.length) {
      setUploadError("Please upload at least one photo of the inside of your vehicle.");
      setIsSubmitting(false);
      return;
    }

    try {
      let vehicleExteriorPhotoUrl = user?.vehicle_exterior_photo_url || '';
      let vehicleInteriorPhotoUrls = user?.vehicle_interior_photo_urls || [];
      let policyPhotoUrl = user?.auto_policy_photo_url || '';

      if (vehicleData.vehicle_exterior_image) {
        setUploadProgress('Uploading exterior photo...');
        const result = await base44.integrations.Core.UploadFile({ file: vehicleData.vehicle_exterior_image });
        vehicleExteriorPhotoUrl = result.file_url;
      }

      if (vehicleData.vehicle_interior_images.length > 0) {
        // Upload interior photos one at a time to avoid parallel failures
        const uploadedUrls = [];
        for (let i = 0; i < vehicleData.vehicle_interior_images.length; i++) {
          setUploadProgress(`Uploading interior photo ${i + 1} of ${vehicleData.vehicle_interior_images.length}...`);
          const result = await base44.integrations.Core.UploadFile({ file: vehicleData.vehicle_interior_images[i] });
          uploadedUrls.push(result.file_url);
        }
        vehicleInteriorPhotoUrls = uploadedUrls;
      }

      let insuranceSubmittedDate = user?.insurance_submitted_date;
      if (vehicleData.auto_policy_image) {
        setUploadProgress('Uploading insurance card...');
        const result = await base44.integrations.Core.UploadFile({ file: vehicleData.auto_policy_image });
        policyPhotoUrl = result.file_url;
        insuranceSubmittedDate = new Date().toISOString();
      }

      setUploadProgress('Saving your details...');

      // Log the vehicle edit
      const isNewSubmission = !user?.vehicle_make;
      await base44.entities.UserEdit.create({
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        change_type: "vehicle",
        change_description: isNewSubmission ? `Submitted vehicle for review` : `Updated vehicle information`,
        old_values: {
          make: user?.vehicle_make || null,
          model: user?.vehicle_model || null,
          year: user?.vehicle_year || null,
          color: user?.vehicle_color || null,
          license_plate: user?.license_plate || null
        },
        new_values: {
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          color: vehicleData.color,
          license_plate: vehicleData.license_plate
        }
      });

      await base44.auth.updateMe({
        vehicle_make: vehicleData.make,
        vehicle_model: vehicleData.model,
        vehicle_year: vehicleData.year,
        vehicle_color: vehicleData.color,
        license_plate: vehicleData.license_plate,
        seats_available: vehicleData.seats_available,
        bags_allowed: vehicleData.bags_allowed,
        vehicle_exterior_photo_url: vehicleExteriorPhotoUrl,
        vehicle_interior_photo_urls: vehicleInteriorPhotoUrls,
        auto_policy_photo_url: policyPhotoUrl,
        insurance_submitted_date: insuranceSubmittedDate,
        vehicle_pending_review: true,
        vehicle_verified: false
      });

      // Notify admin of new vehicle submission
      try {
        await base44.entities.AdminMessage.create({
          recipient_id: 'admin',
          recipient_name: 'Admin',
          subject: `Vehicle Pending Review: ${user.full_name}`,
          message: `A user has submitted their vehicle for review.\n\nUser: ${user.full_name}\nEmail: ${user.email}\nVehicle: ${vehicleData.year} ${vehicleData.make} ${vehicleData.model} (${vehicleData.color})\nLicense Plate: ${vehicleData.license_plate}\n\nPlease review in the Admin Dashboard.`,
          message_type: 'action_required'
        });
      } catch (notifyErr) {
        console.error("Error notifying admin:", notifyErr);
      }

      // Fire onboarding email (non-blocking)
      sendOnboardingEmail({}).catch(() => null);

      setUploadProgress('');
      clearDraft(VEHICLE_DRAFT_KEY);
      alert("Vehicle details submitted for review! You'll be notified once verified.");
      
      // Navigate to Driver Agreement
      const updatedUser = await base44.auth.me();
      if (!updatedUser.driver_agreement_accepted) {
        navigate(createPageUrl("DriverAgreement"));
      } else {
        window.history.back();
      }
    } catch (error) {
      console.error("Error saving vehicle details:", error);
      setUploadError(`Error saving vehicle details: ${error.message || 'Please try again.'}`);
      setUploadProgress('');
    }
    
    setIsSubmitting(false);
  };

  const handleStripeConnect = async () => {
    setIsCreatingStripe(true);
    try {
      const appUrl = window.location.origin;
      const { data } = await createConnectAccount({
        refresh_url: `${appUrl}${createPageUrl("Account")}?refresh=true`,
        return_url: `${appUrl}${createPageUrl("Account")}?success=true`
      });

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Connect onboarding
      window.location.href = data.url;
    } catch (error) {
      console.error("Error creating Connect account:", error);
      alert("Error setting up payout account. You can complete this later from your Account page.");
      window.history.back();
    }
  };

  return (
    <div className="p-4 md:p-8 bg-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl("Account")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-secondary">vehicle details</h1>
        </div>

        <Card className="shadow-lg border-border bg-white rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-secondary">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Car className="w-5 h-5 text-primary" />
              </div>
              enter your vehicle information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {uploadError}
              </div>
            )}
            {uploadProgress && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                {uploadProgress}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="make">make</Label>
                  <Input
                    id="make"
                    value={vehicleData.make}
                    onChange={(e) => handleInputChange('make', e.target.value)}
                    placeholder="e.g., Toyota"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">model</Label>
                  <Input
                    id="model"
                    value={vehicleData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="e.g., Camry"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="year">year</Label>
                  <Input
                   id="year"
                   type="number"
                   min="1990"
                   max="2030"
                    value={vehicleData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    placeholder="e.g., 2020"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">color</Label>
                  <Input
                    id="color"
                    value={vehicleData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    placeholder="e.g., Silver"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="license">license plate</Label>
                  <Input
                    id="license"
                    value={vehicleData.license_plate}
                    onChange={(e) => handleInputChange('license_plate', e.target.value)}
                    placeholder="e.g., ABC-123"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seats">number of seats</Label>
                  <Select
                    value={vehicleData.seats_available.toString()}
                    onValueChange={(value) => handleInputChange('seats_available', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 8 }, (_, i) => (
                        <SelectItem key={i + 2} value={(i + 2).toString()}>
                          {i + 2} seats
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exterior-image">outside of car photo *</Label>
                <Input
                  id="exterior-image"
                  type="file"
                  accept="image/*"
                  onChange={handleExteriorImageUpload}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                  required={!user?.vehicle_exterior_photo_url}
                />
                <p className="text-xs text-gray-500">Upload a clear photo of the outside of your vehicle</p>
                {user?.vehicle_exterior_photo_url && (
                  <p className="text-xs text-primary">✓ Exterior photo already uploaded. Upload a new one to replace it.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="interior-images">inside of car photos *</Label>
                <Input
                  id="interior-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleInteriorImagesUpload}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                  required={!user?.vehicle_interior_photo_urls?.length}
                />
                <p className="text-xs text-gray-500">Upload clear photos of the inside of your vehicle (you can select multiple)</p>
                {user?.vehicle_interior_photo_urls?.length > 0 && (
                  <p className="text-xs text-primary">✓ {user.vehicle_interior_photo_urls.length} interior photo(s) already uploaded. Upload new ones to replace them.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="policy">upload a photo of your auto insurance card *</Label>
                <Input
                  id="policy"
                  type="file"
                  accept="image/*"
                  onChange={handlePolicyImageUpload}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                  required={!user?.auto_policy_photo_url}
                />
                <p className="text-xs text-gray-500">Upload a clear photo of your auto insurance card (both front and back)</p>
                {user?.auto_policy_photo_url && (
                  <p className="text-xs text-primary">✓ Insurance card photo already uploaded. Upload a new one to replace it.</p>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  id="bags"
                  checked={vehicleData.bags_allowed}
                  onCheckedChange={(checked) => handleInputChange('bags_allowed', checked)}
                />
                <Label htmlFor="bags">bags ok</Label>
              </div>

              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="px-12 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'saving...' : 'submit for review'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <footer className="pt-6 border-t border-border text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Cruise Kauaʻi. All rights reserved.
        </footer>
      </div>

      {/* Stripe Connect Modal */}
      <Dialog open={showStripeModal} onOpenChange={setShowStripeModal}>
        <DialogContent className="sm:max-w-lg bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-secondary">
              one more step: connect your bank account
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              To become a driver and receive payouts, you need to connect your bank account via Stripe Connect.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
              <p className="font-semibold mb-2">What you'll need:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Bank account information (routing & account number)</li>
                <li>Social Security Number or EIN</li>
                <li>Date of birth</li>
                <li>Home address</li>
              </ul>
              <p className="mt-3 text-xs">This information is securely stored by Stripe and never shared.</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800">
              <p className="font-semibold mb-1">Why this is required:</p>
              <p>All drivers must have a connected bank account to receive payouts from completed rides.</p>
            </div>

            <div className="bg-gray-100 border border-gray-300 rounded-2xl p-4 text-sm text-gray-900">
              <p className="font-semibold mb-2">Important - During Stripe setup:</p>
              <p className="mb-3">When creating your account, Stripe will ask you what industry you're a part of and to share the website where you are selling a service.</p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li><strong>Industry:</strong> Select "Transportation" then "Ridesharing"</li>
                <li><strong>Website:</strong> Click the link below to copy it and paste it into the website field</li>
              </ul>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("https://ride-connect-b7a57d59.base44.app");
                  alert("Website link copied to clipboard!");
                }}
                className="w-full p-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-mono text-xs hover:bg-gray-200 transition-colors"
              >
                https://ride-connect-b7a57d59.base44.app
                <span className="ml-2 text-gray-600">(click to copy)</span>
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowStripeModal(false);
                window.history.back();
              }}
              variant="outline"
              className="flex-1 rounded-2xl"
            >
              do this later
            </Button>
            <Button
              onClick={handleStripeConnect}
              disabled={isCreatingStripe}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-2xl"
            >
              {isCreatingStripe ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  connect bank account
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}