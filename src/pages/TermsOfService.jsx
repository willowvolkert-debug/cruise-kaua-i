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
                  <p>By accessing or using Cruise Kauaʻi ("Cruise Kauaʻi," "we," "us," or "our"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms").</p>
                  <p className="mt-2">If you do not agree to these Terms, you must not access or use the platform.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">2. Platform Description</h3>
                  <p className="mb-2">Cruise Kauaʻi is a technology platform that enables users to connect with one another to arrange voluntary, cost-sharing carpools.</p>
                  <p className="font-semibold mb-2">Cruise Kauaʻi:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Is not a transportation provider, carrier, broker, or insurer;</li>
                    <li>Does not own, lease, or operate vehicles;</li>
                    <li>Does not employ drivers;</li>
                    <li>Does not provide rides, transportation services, or commercial ride-hailing services.</li>
                  </ul>
                  <p className="mt-2">All transportation services are provided solely by independent users, and any agreement to share a ride is entered into directly between users.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">3. No Agency or Employment Relationship</h3>
                  <p>No joint venture, partnership, employment, agency, or carrier relationship exists between Cruise Kauaʻi and any user, including drivers.</p>
                  <p className="mt-2">Drivers are independent individuals and are solely responsible for their conduct, vehicles, insurance, and compliance with applicable laws.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">4. Assumption of Risk</h3>
                  <p className="font-semibold uppercase mb-2">YOU EXPRESSLY ACKNOWLEDGE AND AGREE THAT USE OF THE PLATFORM AND PARTICIPATION IN CARPOOLING ACTIVITIES INVOLVES INHERENT RISKS, INCLUDING BUT NOT LIMITED TO:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Personal injury or death</li>
                    <li>Vehicle accidents</li>
                    <li>Property damage</li>
                    <li>Acts or omissions of other users</li>
                  </ul>
                  <p className="mt-2 font-semibold">By using Cruise Kauaʻi, you VOLUNTARILY AND KNOWINGLY ASSUME ALL SUCH RISKS, whether foreseeable or unforeseeable, to the fullest extent permitted by Hawaii law.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">5. Disclaimer of Liability</h3>
                  <p className="mb-2">To the maximum extent permitted by Hawaii law, Cruise Kauaʻi DISCLAIMS ALL LIABILITY for any claims, damages, losses, or injuries arising out of or related to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Any ride, carpool, or transportation activity</li>
                    <li>Acts or omissions of drivers or passengers</li>
                    <li>Vehicle condition or operation</li>
                    <li>Insurance coverage or lack thereof</li>
                    <li>Disputes between users</li>
                  </ul>
                  <p className="mt-2">Cruise Kauaʻi does not guarantee the safety, legality, suitability, or insurance coverage of any user or ride.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">6. Driver Responsibilities</h3>
                  <p className="mb-2">All drivers agree that they are solely responsible for:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Maintaining a safe, roadworthy, and legally registered vehicle</li>
                    <li>Holding a valid driver's license</li>
                    <li>Complying with all Hawaii traffic, safety, and insurance laws</li>
                    <li>Maintaining active automobile insurance coverage as required by law</li>
                    <li>Confirming with their insurer that carpooling activity is covered</li>
                    <li>Ensuring all cost-sharing charges are limited to actual trip expenses</li>
                    <li>Not engaging in commercial or for-hire transportation activities</li>
                  </ul>
                  <p className="mt-2">Drivers acknowledge that Cruise Kauaʻi does not verify insurance coverage or compliance beyond basic information collection.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">7. Passenger Responsibilities</h3>
                  <p className="mb-2">Passengers agree to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Act lawfully, responsibly, and respectfully</li>
                    <li>Follow reasonable safety instructions from drivers</li>
                    <li>Refrain from illegal, disruptive, or unsafe conduct</li>
                    <li>Respect drivers, vehicles, and other users</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">8. Insurance Disclosure (IMPORTANT NOTICE)</h3>
                  <p className="font-semibold uppercase mb-2">Cruise Kauaʻi DOES NOT PROVIDE AUTOMOBILE OR LIABILITY INSURANCE.</p>
                  <p className="mb-2">Drivers are solely responsible for maintaining legally required insurance coverage.</p>
                  <p className="mb-2">Users acknowledge that:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Personal auto insurance may not cover carpooling or cost-sharing activities</li>
                    <li>Any damages or injuries may not be fully insured</li>
                    <li>Cruise Kauaʻi is not responsible for insurance gaps or denied claims</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">9. Cost-Sharing Only (Non-Commercial Use)</h3>
                  <p className="mb-2">Cruise Kauaʻi is intended solely for voluntary cost-sharing carpools.</p>
                  <p className="mb-2">Drivers may only request reimbursement reasonably related to actual trip costs (e.g., fuel, tolls, vehicle wear).</p>
                  <p>Drivers may not generate profit, receive compensation, or provide transportation for hire.</p>
                  <p className="mt-2 font-semibold">Use of the platform for commercial ridesharing or for-hire transportation is strictly prohibited.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">10. No Background Checks</h3>
                  <p className="mb-2">Cruise Kauaʻi does not conduct criminal background checks, driving record checks, or continuous monitoring of users.</p>
                  <p className="mb-2">Any license or vehicle verification is limited and does not constitute endorsement or certification.</p>
                  <p className="font-semibold">Users are solely responsible for exercising their own judgment and caution.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">11. Waiver and Release of Claims</h3>
                  <p className="mb-2">To the fullest extent permitted by Hawaii law, you WAIVE, RELEASE, AND FOREVER DISCHARGE Cruise Kauaʻi and its owners, officers, employees, and affiliates from any and all claims, known or unknown, arising out of or related to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Use of the platform</li>
                    <li>Participation in carpooling activities</li>
                    <li>Acts or omissions of other users</li>
                  </ul>
                  <p className="mt-2 text-sm italic">This waiver does not apply to claims that cannot be waived under applicable law.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">12. Indemnification</h3>
                  <p className="mb-2">You agree to defend, indemnify, and hold harmless Cruise Kauaʻi from any claims, damages, losses, liabilities, or expenses arising from:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Your use of the platform</li>
                    <li>Your violation of these Terms</li>
                    <li>Your violation of any law</li>
                    <li>Your acts or omissions related to carpooling activities</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">13. User Conduct</h3>
                  <p className="mb-2">Users must not:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Engage in harassment, discrimination, or threats</li>
                    <li>Use the platform for illegal purposes</li>
                    <li>Misrepresent identity, insurance, or eligibility</li>
                    <li>Attempt to circumvent platform safeguards</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">14. Arbitration & Governing Law</h3>
                  <p className="mb-2">These Terms are governed by the laws of the State of Hawaii, without regard to conflict-of-law principles.</p>
                  <p>Any dispute shall be resolved through binding arbitration conducted in Kauaʻi County, Hawaii, except where prohibited by law.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">15. Changes to Terms</h3>
                  <p>Cruise Kauaʻi may modify these Terms at any time. Continued use of the platform after changes constitutes acceptance.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">16. Contact Information</h3>
                  <p>For questions regarding these Terms, please contact us through the Cruise Kauaʻi website.</p>
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