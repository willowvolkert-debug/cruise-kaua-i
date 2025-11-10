
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

export default function TermsOfServicePage() {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleAccept = async () => {
    if (!agreed) {
      alert("Please read and accept the terms to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.auth.updateMe({ terms_accepted: true });
      navigate(createPageUrl("PrivacyPolicy"));
    } catch (error) {
      console.error("Error accepting terms:", error);
      alert("Error saving. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 md:p-8 bg-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary mb-2">Terms of Service</h1>
          <p className="text-gray-600">Please read carefully before using Cruise Kauaʻi</p>
        </div>

        <Card className="shadow-lg border-border bg-white rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <FileText className="w-6 h-6 text-primary" />
              Legal Agreement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full rounded-md border bg-white p-6">
              <div className="space-y-6 text-gray-700">
                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">1. Acceptance of Terms</h3>
                  <p>By accessing and using Cruise Kauaʻi, you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">2. Platform Description</h3>
                  <p>Cruise Kauaʻi is a carpooling platform that connects drivers and passengers for shared rides. We are NOT a transportation provider and do not employ drivers. We simply facilitate connections between users.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">3. Disclaimer of Liability</h3>
                  <p className="mb-2">Cruise Kauaʻi explicitly disclaims all liability for:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Personal injuries or death</li>
                    <li>Property damage</li>
                    <li>Financial losses</li>
                    <li>Any other damages arising from ride-sharing activities</li>
                  </ul>
                  <p className="mt-2">The platform is merely a connection service. All rides are arranged directly between users.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">4. Assumption of Risk</h3>
                  <p>By using Cruise Kauaʻi, you acknowledge and agree that you VOLUNTARILY ASSUME ALL RISKS associated with carpooling, including but not limited to risks of personal injury, property damage, and interactions with other users.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">5. Driver Responsibilities</h3>
                  <p className="mb-2">All drivers must:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Maintain a safe, roadworthy vehicle</li>
                    <li>Follow all traffic laws and regulations</li>
                    <li>Possess a valid driver's license</li>
                    <li>Maintain adequate insurance coverage (minimum $2,000,000 third-party liability recommended)</li>
                    <li>Confirm with their insurance provider that carpooling activity is covered</li>
                    <li>Not engage in commercial ride-hailing activities</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">6. Passenger Responsibilities</h3>
                  <p className="mb-2">All passengers must:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Act responsibly and respectfully</li>
                    <li>Follow driver instructions regarding vehicle use</li>
                    <li>Not engage in illegal activities</li>
                    <li>Treat drivers and vehicles with respect</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">7. Insurance Requirements</h3>
                  <p className="font-semibold">IMPORTANT NOTICE:</p>
                  <p className="mb-2">Drivers MUST have valid automobile insurance. It is the driver's responsibility to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Verify with their insurance provider that carpooling is covered</li>
                    <li>Understand that personal auto insurance may not cover commercial activities</li>
                    <li>Maintain a minimum of $2,000,000 in third-party liability coverage (recommended)</li>
                  </ul>
                  <p className="mt-2 font-semibold">Cruise Kauaʻi provides NO insurance coverage and is not liable for any uncovered claims.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">8. Cost-Sharing vs. Commercial Activity</h3>
                  <p>Cruise Kauaʻi is for COST-SHARING only, NOT commercial ride-hailing. Drivers may only charge amounts reasonably related to the actual costs of the trip (fuel, maintenance, etc.). Drivers may NOT use this platform to generate profit.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">9. No Background Checks</h3>
                  <p className="font-semibold">IMPORTANT: Cruise Kauaʻi does NOT conduct background checks on users.</p>
                  <p className="mt-2">While we verify driver's licenses and vehicle information, we do not perform criminal background checks or driving record checks. Users must exercise their own judgment and caution when arranging rides.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">10. Waiver of Claims</h3>
                  <p>By using Cruise Kauaʻi, you waive all claims against Cruise Kauaʻi, its owners, operators, affiliates, and employees related to any disputes, incidents, accidents, or damages arising from ride-sharing activities.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">11. Voluntary Participation</h3>
                  <p>Your participation in Cruise Kauaʻi is completely voluntary. You may stop using the platform at any time.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">12. User Conduct</h3>
                  <p className="mb-2">Users must NOT:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Share personal contact information outside the app</li>
                    <li>Engage in harassment or discriminatory behavior</li>
                    <li>Use the platform for illegal purposes</li>
                    <li>Attempt to defraud other users</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">13. Governing Law</h3>
                  <p>These Terms are governed by the laws of the State of Hawaii, County of Kauaʻi. Any disputes shall be resolved through binding arbitration in Kauaʻi County, Hawaii.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">14. Changes to Terms</h3>
                  <p>Cruise Kauaʻi reserves the right to modify these terms at any time. Continued use of the platform constitutes acceptance of modified terms.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">15. Contact</h3>
                  <p>For questions about these Terms, please use our Contact Us page.</p>
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
                I have read and agree to the Terms of Service
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
