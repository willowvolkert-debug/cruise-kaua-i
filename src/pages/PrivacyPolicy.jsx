
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PrivacyPolicyPage() {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleAccept = async () => {
    if (!agreed) {
      alert("Please read and accept the privacy policy to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.auth.updateMe({ privacy_policy_accepted: true });
      navigate(createPageUrl("CommunityAgreement"));
    } catch (error) {
      console.error("Error accepting privacy policy:", error);
      alert("Error saving. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 md:p-8 bg-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Your privacy is important to us</p>
        </div>

        <Card className="shadow-lg border-border bg-white rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <Shield className="w-6 h-6 text-primary" />
              How We Protect Your Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full rounded-md border bg-white p-6">
              <div className="space-y-6 text-gray-700">
                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">1. Information We Collect</h3>
                  <p className="mb-2">We collect the following types of information:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Account Information:</strong> Name, email, age, gender, username</li>
                    <li><strong>Verification Documents:</strong> Driver's license photos, vehicle information, insurance documents</li>
                    <li><strong>Payment Information:</strong> Credit card details (stored securely through Stripe), bank account information for payouts</li>
                    <li><strong>Trip Information:</strong> Ride details, locations, booking history</li>
                    <li><strong>Communications:</strong> Messages between users, support inquiries</li>
                    <li><strong>Usage Data:</strong> App activity, preferences, ratings</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">2. How We Use Your Information</h3>
                  <p className="mb-2">We use your information to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Facilitate ride-sharing connections between users</li>
                    <li>Process payments and payouts</li>
                    <li>Verify driver credentials and vehicle safety</li>
                    <li>Improve platform safety and user experience</li>
                    <li>Send notifications about bookings and ride updates</li>
                    <li>Provide customer support</li>
                    <li>Comply with legal obligations</li>
                    <li>Prevent fraud and enforce our Terms of Service</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">3. Information Sharing</h3>
                  <p className="mb-2">We share your information in the following circumstances:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>With Other Users:</strong> Profile information, ratings, and trip details are visible to users you connect with</li>
                    <li><strong>Service Providers:</strong> Payment processors (Stripe), cloud storage providers</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
                    <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                  </ul>
                  <p className="mt-2 font-semibold">We do NOT sell your personal information to third parties.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">4. Data Security</h3>
                  <p>We implement industry-standard security measures to protect your data, including:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Encryption of sensitive data in transit and at rest</li>
                    <li>Secure payment processing through PCI-compliant providers</li>
                    <li>Regular security audits and updates</li>
                    <li>Access controls and authentication requirements</li>
                  </ul>
                  <p className="mt-2">However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">5. Data Retention</h3>
                  <p>We retain your information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain information for legal compliance, dispute resolution, and fraud prevention.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">6. Your Rights</h3>
                  <p className="mb-2">You have the right to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Access your personal information</li>
                    <li>Correct inaccurate data</li>
                    <li>Request deletion of your data (subject to legal requirements)</li>
                    <li>Opt out of marketing communications</li>
                    <li>Export your data</li>
                  </ul>
                  <p className="mt-2">To exercise these rights, contact us through the Contact Us page.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">7. Cookies and Tracking</h3>
                  <p>We use cookies and similar technologies to improve user experience, analyze usage patterns, and remember your preferences. You can control cookie settings through your browser.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">8. Third-Party Links</h3>
                  <p>Our platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">9. Children's Privacy</h3>
                  <p>Cruise Kauaʻi is only available to users 18 years and older. We do not knowingly collect information from children under 18.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">10. Changes to Privacy Policy</h3>
                  <p>We may update this Privacy Policy periodically. We will notify users of significant changes through the app or via email.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">11. Contact Information</h3>
                  <p>For privacy-related questions or concerns, please use our Contact Us page.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">12. Hawaii-Specific Rights</h3>
                  <p>As a Hawaii-based platform, we comply with applicable Hawaii state privacy laws and regulations.</p>
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
                I have read and agree to the Privacy Policy
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
