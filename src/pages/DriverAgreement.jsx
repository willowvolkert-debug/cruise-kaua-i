import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DriverAgreementPage() {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleAccept = async () => {
    if (!agreed) {
      alert("Please read and accept the Driver Agreement to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.auth.updateMe({ driver_agreement_accepted: true });
      
      // Check if user needs Stripe Connect onboarding
      const user = await base44.auth.me();
      if (!user.stripe_connect_onboarding_complete) {
        // Will be handled by VehicleDetails page modal
        navigate(createPageUrl("Account"));
      } else {
        navigate(createPageUrl("Account"));
      }
    } catch (error) {
      console.error("Error accepting agreement:", error);
      alert("Error saving. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 md:p-8 bg-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary mb-2">Driver Agreement</h1>
          <p className="text-gray-600">Required for all drivers on Cruise Kauaʻi</p>
        </div>

        <Card className="shadow-lg border-border bg-white rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <FileText className="w-6 h-6 text-primary" />
              Driver Agreement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full rounded-md border bg-white p-6">
              <div className="space-y-6 text-gray-700">
                <p className="font-semibold text-lg text-secondary">
                  By signing this Driver Agreement, I acknowledge and agree to the following:
                </p>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">1. Independent Contractor Status</h3>
                  <p>I am an independent individual and NOT an employee, agent, or representative of Cruise Kauaʻi. I have no authority to bind Cruise Kauaʻi to any contract or obligation.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">2. Vehicle & License Requirements</h3>
                  <p className="mb-2">I certify that:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>I hold a valid, unrestricted driver's license</li>
                    <li>My vehicle is safe, roadworthy, and legally registered</li>
                    <li>I comply with all Hawaii traffic, safety, and insurance laws</li>
                    <li>I have reviewed and understand Hawaii Revised Statutes regarding carpooling and cost-sharing</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">3. Insurance Certification</h3>
                  <p className="mb-2 font-semibold">I certify that:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>I maintain active automobile insurance as required by Hawaii law</li>
                    <li>I have confirmed with my insurance provider that carpooling/cost-sharing is covered under my policy</li>
                    <li>I understand that personal auto insurance may not cover carpooling activities</li>
                    <li>I am solely responsible for any insurance gaps or denied claims</li>
                    <li>Cruise Kauaʻi provides NO insurance coverage and is not liable for any accidents or claims</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">4. Cost-Sharing Only (Non-Commercial)</h3>
                  <p className="mb-2">I agree that:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>I will ONLY charge amounts reasonably related to actual trip costs (fuel, tolls, wear and tear)</li>
                    <li>I will NOT use Cruise Kauaʻi for commercial transportation or profit</li>
                    <li>I will NOT provide rides-for-hire or engage in commercial ridesharing</li>
                    <li>All rides are voluntary cost-sharing arrangements between private individuals</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">5. Safety & Conduct</h3>
                  <p className="mb-2">I agree to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Drive safely and obey all traffic laws</li>
                    <li>Not drive under the influence of alcohol or drugs</li>
                    <li>Treat all passengers with respect and courtesy</li>
                    <li>Maintain a clean and safe vehicle</li>
                    <li>Report any incidents or safety concerns immediately</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">6. Complete Liability Release</h3>
                  <p className="font-semibold mb-2">I understand and agree that:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Cruise Kauaʻi is ONLY a technology platform connecting users</li>
                    <li>Cruise Kauaʻi is NOT a transportation provider, carrier, or insurer</li>
                    <li>Cruise Kauaʻi has NO liability for any accidents, injuries, damages, or disputes</li>
                    <li>I assume ALL responsibility and liability for my driving and vehicle</li>
                    <li>I waive and release ALL claims against Cruise Kauaʻi related to carpooling activities</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">7. Indemnification</h3>
                  <p>I agree to defend, indemnify, and hold harmless Cruise Kauaʻi from any claims, damages, or liabilities arising from my use of the platform or my carpooling activities.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">8. Account Suspension/Termination</h3>
                  <p>I understand that Cruise Kauaʻi may suspend or terminate my driver account at any time for violation of these terms or community standards.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">9. Legal Compliance</h3>
                  <p>I certify that I am legally authorized to drive in Hawaii and that all information I provide is accurate and truthful.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">10. Acceptance</h3>
                  <p className="font-semibold">By checking the box below and clicking "Accept and Continue," I certify that I have read, understand, and agree to ALL terms of this Driver Agreement.</p>
                </section>

                <p className="text-sm italic pt-4">Last Updated: {new Date().toLocaleDateString()}</p>
              </div>
            </ScrollArea>

            <div className="flex items-center space-x-2 mt-6">
              <Checkbox 
                id="agree" 
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked)}
              />
              <Label htmlFor="agree" className="cursor-pointer">
                I have read and agree to the Driver Agreement
              </Label>
            </div>

            <Button
              onClick={handleAccept}
              disabled={!agreed || isSubmitting}
              className="w-full mt-4 bg-primary hover:bg-primary/90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Accepting...' : 'Accept and Continue'}
            </Button>
          </CardContent>
        </Card>

        <footer className="pt-6 border-t border-border text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Cruise Kauaʻi. All rights reserved.
        </footer>
      </div>
    </div>
  );
}