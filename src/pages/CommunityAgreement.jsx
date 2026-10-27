import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle, Shield, Heart, DollarSign, Users, MessageCircle, Clock, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CommunityAgreementPage() {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleAccept = async () => {
    if (!agreed) {
      alert("Please read and accept the community agreement to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.auth.updateMe({ community_agreement_accepted: true });
      
      // Auto-upgrade to rider if all requirements met
      const updatedUser = await base44.auth.me();
      if (updatedUser.profile_complete && updatedUser.drivers_license_verified && 
          updatedUser.terms_accepted && updatedUser.privacy_policy_accepted && 
          updatedUser.community_agreement_accepted && (!updatedUser.user_type || updatedUser.user_type === 'new')) {
        await base44.auth.updateMe({ user_type: 'rider' });
      }
      
      navigate(createPageUrl("Account"));
    } catch (error) {
      console.error("Error accepting community agreement:", error);
      alert("Error saving. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 md:p-8 bg-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary mb-2">community agreement</h1>
          <p className="text-gray-600">our shared values for safe, respectful ride-sharing</p>
        </div>

        <Card className="shadow-lg border-border bg-white rounded-3xl">
          <CardHeader>
            <CardTitle className="text-2xl text-secondary text-center">cruise hawaiʻi values</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border bg-white rounded-2xl">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-2xl">
                      <Shield className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary">safety first</h3>
                  </div>
                  <p className="text-gray-700">
                    Always trust your instincts, use the review tool to promote safe driving & conduct, and report any safety concerns immediately.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-white rounded-2xl">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-2xl">
                      <Heart className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary">respect & aloha</h3>
                  </div>
                  <p className="text-gray-700">
                    Treat every rider and driver with kindness and respect. We're building a community, not just sharing rides.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-white rounded-2xl">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-2xl">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary">shared transportation costs</h3>
                  </div>
                  <p className="text-gray-700">
                    We share rides to make travel more affordable for everyone—this is cost-sharing, not profit-making.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-white rounded-2xl">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-2xl">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary">accountability</h3>
                  </div>
                  <p className="text-gray-700">
                    Keep your commitments. If you book a ride or offer seats, follow through or communicate changes promptly.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-white rounded-2xl">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-100 rounded-2xl">
                      <MessageCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary">prompt & clear communication</h3>
                  </div>
                  <p className="text-gray-700">
                    Keep all riders/drivers informed about your plans, arrival times, and any changes. For your safety, only use in-app messaging, and let trusted friends & family know about your ride.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-white rounded-2xl">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 rounded-2xl">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary">punctuality & flexibility</h3>
                  </div>
                  <p className="text-gray-700">
                    Be on time and ready when agreed. Island time is real, but respect others' schedules. If running late or taking a flexible ride, communicate properly.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-white rounded-2xl">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-2xl">
                      <Leaf className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary">environmental stewardship</h3>
                  </div>
                  <p className="text-gray-700">
                    By sharing rides, we're reducing traffic and protecting Kauaʻi's natural beauty for future generations.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-white rounded-2xl">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-pink-100 rounded-2xl">
                      <Heart className="w-6 h-6 text-pink-600" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary">vehicle care</h3>
                  </div>
                  <p className="text-gray-700">
                    Respect the driver's vehicle. Keep it clean, be mindful of eating/drinking, and treat it as you would your own car.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary bg-primary/5 rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-secondary mb-3">by accepting this agreement, I commit to:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Following all community values and guidelines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Providing honest reviews to help build a safe community</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Reporting any safety concerns or violations immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Respecting the Cruise Hawaiʻi platform and fellow community members</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <div className="flex items-center space-x-2 pt-4">
              <Checkbox 
                id="agree" 
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked)}
              />
              <Label htmlFor="agree" className="cursor-pointer">
                I have read and agree to the Community Agreement
              </Label>
            </div>

            <Button
              onClick={handleAccept}
              disabled={!agreed || isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 rounded-2xl"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isSubmitting ? 'accepting...' : 'accept and continue'}
            </Button>
          </CardContent>
        </Card>

        <footer className="pt-6 border-t border-border text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Cruise Hawaiʻi. All rights reserved.
        </footer>
      </div>
    </div>
  );
}