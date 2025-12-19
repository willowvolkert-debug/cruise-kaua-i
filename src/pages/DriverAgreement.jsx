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
                <p className="font-semibold text-lg text-secondary mb-4">
                  Driver Participation Agreement
                </p>
                <p className="mb-4">
                  This Driver Participation Agreement ("Agreement") is entered into between you ("Driver") and Cruise Kauaʻi.
                </p>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">1. Agreement to Terms</h3>
                  <p className="mb-2">By registering as a driver or offering rides through Cruise Kauaʻi, you confirm that you have read, understand, and agree to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>This Agreement</li>
                    <li>Cruise Kauaʻi Terms of Service</li>
                    <li>All applicable Hawaii laws and regulations</li>
                  </ul>
                  <p className="mt-2">If you do not agree, you may not use the platform as a driver.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">2. Independent Status</h3>
                  <p className="mb-2">You acknowledge and agree that:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>You are not an employee, agent, partner, or contractor of Cruise Kauaʻi</li>
                    <li>You act solely as an independent individual</li>
                    <li>Cruise Kauaʻi does not control how, when, or whether you provide rides</li>
                    <li>You are solely responsible for your conduct, vehicle, and compliance with law</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">3. Non-Commercial, Cost-Sharing Use Only</h3>
                  <p className="mb-2">You certify that:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>All rides are voluntary and incidental to your own travel</li>
                    <li>Any amounts requested from passengers are limited to reasonable cost-sharing</li>
                    <li>You will not generate profit, wages, or compensation</li>
                    <li>You will not provide transportation for hire or commercial ride services</li>
                  </ul>
                  <p className="mt-2 font-semibold">Violation of this section may result in immediate removal.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">4. Driver Eligibility & Legal Compliance</h3>
                  <p className="mb-2">You represent and warrant that you:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Hold a valid Hawaii driver's license</li>
                    <li>Are legally permitted to operate a motor vehicle</li>
                    <li>Comply with all traffic and safety laws</li>
                    <li>Will not operate while impaired, fatigued, or distracted</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">5. Vehicle Standards</h3>
                  <p className="mb-2">You certify that your vehicle:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Is legally registered and in safe, roadworthy condition</li>
                    <li>Meets all Hawaii safety and inspection requirements</li>
                    <li>Is not a taxicab, limousine, or for-hire vehicle</li>
                  </ul>
                  <p className="mt-2">You agree to remove your vehicle from the platform if it becomes unsafe or non-compliant.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">6. Insurance Acknowledgment (CRITICAL DISCLOSURE)</h3>
                  <p className="mb-2 font-semibold uppercase">You acknowledge and agree that:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Cruise Kauaʻi does not provide insurance</li>
                    <li>You are solely responsible for maintaining legally required auto insurance</li>
                    <li>Your personal insurance may not cover carpooling or cost-sharing</li>
                    <li>Any damages, injuries, or claims may be uninsured or underinsured</li>
                  </ul>
                  <p className="mt-2 font-semibold">You certify that you have confirmed coverage with your insurer.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">7. Assumption of Risk</h3>
                  <p className="mb-2">You knowingly and voluntarily assume all risks arising from:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Operating a motor vehicle</li>
                    <li>Transporting passengers</li>
                    <li>Interacting with platform users</li>
                  </ul>
                  <p className="mt-2">You agree that Cruise Kauaʻi bears no responsibility for such risks.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">8. Indemnification</h3>
                  <p className="mb-2">You agree to defend, indemnify, and hold harmless Cruise Kauaʻi from any claims, damages, losses, liabilities, or expenses arising from:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Your driving</li>
                    <li>Vehicle condition</li>
                    <li>Insurance coverage or lack thereof</li>
                    <li>Violations of law or this Agreement</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">9. No Background Checks or Monitoring</h3>
                  <p className="mb-2">You acknowledge that Cruise Kauaʻi:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Does not conduct criminal or driving history checks</li>
                    <li>Does not monitor driving behavior</li>
                    <li>Does not guarantee passenger conduct or safety</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">10. Suspension or Termination</h3>
                  <p>Cruise Kauaʻi may suspend or terminate your access at any time for safety, compliance, or legal concerns.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">11. Governing Law</h3>
                  <p>This Agreement is governed by the laws of the State of Hawaii.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">12. Electronic Acceptance</h3>
                  <p className="font-semibold">By clicking "I Agree," you acknowledge this Agreement has the same legal effect as a written signature.</p>
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