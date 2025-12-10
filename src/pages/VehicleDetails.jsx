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
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { createConnectAccount } from "@/functions/createConnectAccount";

export default function VehicleDetailsPage() {
  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    license_plate: '',
    seats_available: 4,
    bags_allowed: true,
    vehicle_image: null,
    auto_policy_image: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [isCreatingStripe, setIsCreatingStripe] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.vehicle_make) {
          setVehicleData({
            make: currentUser.vehicle_make || '',
            model: currentUser.vehicle_model || '',
            year: currentUser.vehicle_year || '',
            color: currentUser.vehicle_color || '',
            license_plate: currentUser.license_plate || '',
            seats_available: currentUser.seats_available || 4,
            bags_allowed: currentUser.bags_allowed !== undefined ? currentUser.bags_allowed : true,
            vehicle_image: null,
            auto_policy_image: null
          });
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

  const handleVehicleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVehicleData(prev => ({ ...prev, vehicle_image: file }));
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

    if (!vehicleData.vehicle_image && !user?.vehicle_photo_url) {
      setUploadError("Please upload a vehicle photo.");
      setIsSubmitting(false);
      return;
    }

    try {
      let vehiclePhotoUrl = user?.vehicle_photo_url || '';
      let policyPhotoUrl = user?.auto_policy_photo_url || '';

      if (vehicleData.vehicle_image) {
        const result = await base44.integrations.Core.UploadFile({ file: vehicleData.vehicle_image });
        vehiclePhotoUrl = result.file_url;
      }

      if (vehicleData.auto_policy_image) {
        const result = await base44.integrations.Core.UploadFile({ file: vehicleData.auto_policy_image });
        policyPhotoUrl = result.file_url;
      }

      await base44.auth.updateMe({
        vehicle_make: vehicleData.make,
        vehicle_model: vehicleData.model,
        vehicle_year: vehicleData.year,
        vehicle_color: vehicleData.color,
        license_plate: vehicleData.license_plate,
        seats_available: vehicleData.seats_available,
        bags_allowed: vehicleData.bags_allowed,
        vehicle_photo_url: vehiclePhotoUrl,
        auto_policy_photo_url: policyPhotoUrl,
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

      alert("Vehicle details submitted for review! You'll be notified once verified.");
      
      // Check if user needs to complete Stripe Connect onboarding
      const updatedUser = await base44.auth.me();
      if (!updatedUser.stripe_connect_onboarding_complete) {
        setShowStripeModal(true);
      } else {
        window.history.back();
      }
    } catch (error) {
      console.error("Error saving vehicle details:", error);
      setUploadError("Error saving vehicle details. Please try again.");
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
                    max="2025"
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
                <Label htmlFor="image">vehicle photo *</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleVehicleImageUpload}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                  required={!user?.vehicle_photo_url}
                />
                <p className="text-xs text-gray-500">Upload a clear photo of your vehicle</p>
                {user?.vehicle_photo_url && (
                  <p className="text-xs text-primary">✓ Vehicle photo already uploaded. Upload a new one to replace it.</p>
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