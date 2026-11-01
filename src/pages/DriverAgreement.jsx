import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, CheckCircle, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { jsPDF } from "jspdf";

export default function DriverAgreementPage() {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [checkboxes, setCheckboxes] = useState({
    notTransportProvider: false,
    notEmployee: false,
    solelyResponsible: false,
    incidentalTravel: false,
    noProfit: false,
    noForHire: false,
    validLicense: false,
    vehicleRegistered: false,
    vehicleSafe: false,
    willRemoveUnsafe: false,
    hasInsurance: false,
    noInsuranceProvided: false,
    insuranceDenial: false,
    confirmedCoverage: false,
    inherentRisk: false,
    passengersIndependent: false,
    accidentsMayOccur: false,
    noBackgroundChecks: false,
    responsibleInteractions: false,
    indemnify: false,
    financialResponsibility: false,
    accurateInfo: false,
    violationRemoval: false,
    voluntaryParticipation: false,
    keepQuietPlacesQuiet: false,
  });

  const allCheckboxesChecked = Object.values(checkboxes).every(val => val === true);

  const handleCheckboxChange = (key) => {
    setCheckboxes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const margin = 50;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPage = (needed) => {
      if (y + needed > pageHeight - margin) { doc.addPage(); y = margin; }
    };

    const addText = (text, fontSize, isBold, color = [40, 40, 40], extraAfter = 0) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      const lineHeight = fontSize * 1.5;
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach(line => {
        checkPage(lineHeight);
        doc.text(line, margin, y);
        y += lineHeight;
      });
      if (extraAfter > 0) { checkPage(extraAfter); y += extraAfter; }
    };

    addText('Cruise LLC', 22, true, [34, 85, 55], 6);
    addText('Driver Participation Agreement', 18, true, [30, 80, 120], 4);
    addText(`Last Updated: ${new Date().toLocaleDateString()}`, 10, false, [120, 120, 120], 10);
    addText('This Driver Participation Agreement ("Agreement") is entered into between you ("Driver") and Cruise LLC.', 10, false, [40, 40, 40], 18);

    const sections = [
      ['1. Agreement to Terms', 'By registering as a driver or offering rides through Cruise LLC, you confirm that you have read, understand, and agree to this Agreement, the Cruise LLC Terms of Service, and all applicable Hawaii laws and regulations. If you do not agree, you may not use the platform as a driver.'],
      ['2. Independent Status', 'You are not an employee, agent, partner, or contractor of Cruise LLC. You act solely as an independent individual. Cruise LLC does not control how, when, or whether you provide rides. You are solely responsible for your conduct, vehicle, and compliance with law.'],
      ['3. Non-Commercial, Cost-Sharing Use Only', 'All rides are voluntary and incidental to your own travel. Any amounts requested from passengers are limited to reasonable cost-sharing. You will not generate profit, wages, or compensation. You will not provide transportation for hire or commercial ride services. Violation of this section may result in immediate removal.'],
      ['4. Driver Eligibility & Legal Compliance', "You represent and warrant that you hold a valid Hawaii driver's license, are legally permitted to operate a motor vehicle, comply with all traffic and safety laws, and will not operate while impaired, fatigued, or distracted."],
      ['5. Vehicle Standards', 'Your vehicle is legally registered and in safe, roadworthy condition, meets all Hawaii safety and inspection requirements, and is not a taxicab, limousine, or for-hire vehicle. You agree to remove your vehicle from the platform if it becomes unsafe or non-compliant.'],
      ['6. Insurance Acknowledgment', 'Drivers are responsible for maintaining legally required insurance coverage, and Cruise LLC encourages all users to confirm their coverage related to carpooling activities. Cruise LLC does not provide insurance coverage, and we encourage you to confirm with your insurer that carpooling activities are covered.'],
      ['7. Shared Responsibility', 'Cruise LLC serves as a coordination platform connecting independent community members for voluntary cost-sharing carpools. As a driver, you acknowledge responsibility for safe operation of your motor vehicle, your interactions with passengers, and compliance with all applicable laws and safety standards.'],
      ['8. Indemnification', 'You agree to defend, indemnify, and hold harmless Cruise LLC from any claims, damages, losses, liabilities, or expenses arising from your driving, vehicle condition, insurance coverage, or violations of law or this Agreement.'],
      ['9. Safety Standards & Community Responsibility', 'Cruise LLC is actively evaluating operational best practices and safety standards appropriate for community-based carpool coordination. We require license verification for all drivers and are committed to continuously improving our community safety processes. Users are encouraged to exercise good judgment when connecting with other community members.'],
      ['10. Keep quiet places quiet', 'I agree not to disclose special spots to visitors, and only recommend people to check out well known tourist destinations.'],
      ['11. Suspension or Termination', 'Cruise LLC may suspend or terminate your access at any time for safety, compliance, or legal concerns.'],
      ['12. Governing Law', 'This Agreement is governed by the laws of the State of Hawaii.'],
      ['13. Electronic Acceptance', 'By clicking "I Agree," you acknowledge this Agreement has the same legal effect as a written signature.'],
    ];

    sections.forEach(([title, body]) => {
      addText(title, 12, true, [30, 80, 120], 3);
      addText(body, 10, false, [40, 40, 40], 12);
    });

    doc.save('CruiseLLC-DriverAgreement.pdf');
  };

  const handleAccept = async () => {
    if (!agreed || !allCheckboxesChecked) {
      alert("Please read the agreement and check all boxes to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const timestamp = new Date().toISOString();
      await base44.auth.updateMe({ 
        driver_agreement_accepted: true,
        driver_agreement_timestamp: timestamp
      });
      
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
          <p className="text-gray-600 mb-3">Required for all drivers on Cruise LLC</p>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="rounded-2xl">
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
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
                  This Driver Participation Agreement ("Agreement") is entered into between you ("Driver") and Cruise LLC.
                </p>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">1. Agreement to Terms</h3>
                  <p className="mb-2">By registering as a driver or offering rides through Cruise LLC, you confirm that you have read, understand, and agree to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>This Agreement</li>
                    <li>Cruise LLC Terms of Service</li>
                    <li>All applicable Hawaii laws and regulations</li>
                  </ul>
                  <p className="mt-2">If you do not agree, you may not use the platform as a driver.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">2. Independent Status</h3>
                  <p className="mb-2">You acknowledge and agree that:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>You are not an employee, agent, partner, or contractor of Cruise LLC</li>
                    <li>You act solely as an independent individual</li>
                    <li>Cruise LLC does not control how, when, or whether you provide rides</li>
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
                  <h3 className="font-bold text-lg text-secondary mb-2">6. Insurance Acknowledgment</h3>
                  <p className="mb-2">Drivers are responsible for maintaining legally required insurance coverage, and Cruise LLC encourages all users to confirm their coverage related to carpooling activities. You acknowledge and agree that:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Cruise LLC does not provide insurance coverage</li>
                    <li>You are responsible for maintaining legally required auto insurance</li>
                    <li>We encourage you to confirm with your insurer that carpooling activities are covered</li>
                  </ul>
                  <p className="mt-2">You certify that you have reviewed your insurance coverage in relation to carpooling.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">7. Shared Responsibility</h3>
                  <p className="mb-2">Cruise LLC serves as a coordination platform connecting independent community members for voluntary cost-sharing carpools. As a driver, you acknowledge responsibility for:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Safe operation of your motor vehicle</li>
                    <li>Your interactions with passengers and platform users</li>
                    <li>Compliance with all applicable laws and safety standards</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">8. Indemnification</h3>
                  <p className="mb-2">You agree to defend, indemnify, and hold harmless Cruise LLC from any claims, damages, losses, liabilities, or expenses arising from:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Your driving</li>
                    <li>Vehicle condition</li>
                    <li>Insurance coverage or lack thereof</li>
                    <li>Violations of law or this Agreement</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">9. Safety Standards & Community Responsibility</h3>
                  <p>Cruise LLC is actively evaluating operational best practices and safety standards appropriate for community-based carpool coordination. We require license verification for all drivers and are committed to continuously improving our community safety processes. Users are encouraged to exercise good judgment when connecting with other community members.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">10. Keep quiet places quiet</h3>
                  <p>I agree not to disclose special spots to visitors, and only recommend people to check out well known tourist destinations.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">11. Suspension or Termination</h3>
                  <p>Cruise LLC may suspend or terminate your access at any time for safety, compliance, or legal concerns.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">12. Governing Law</h3>
                  <p>This Agreement is governed by the laws of the State of Hawaii.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-secondary mb-2">13. Electronic Acceptance</h3>
                  <p className="font-semibold">By clicking "I Agree," you acknowledge this Agreement has the same legal effect as a written signature.</p>
                </section>

                <p className="text-sm italic pt-4">Last Updated: {new Date().toLocaleDateString()}</p>
              </div>
            </ScrollArea>

            <div className="mt-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <p className="font-semibold text-secondary mb-3">By checking all boxes below, I certify that:</p>
                <div className="space-y-2">
                  {[
                    { key: 'notTransportProvider', label: 'I understand Cruise LLC is not a transportation provider' },
                    { key: 'notEmployee', label: 'I understand I am not an employee or agent' },
                    { key: 'solelyResponsible', label: 'I understand I am solely responsible for my actions' },
                    { key: 'incidentalTravel', label: 'My rides are incidental to my own travel' },
                    { key: 'noProfit', label: 'I will not make a profit from rides' },
                    { key: 'noForHire', label: 'I will not provide transportation for hire' },
                    { key: 'validLicense', label: 'I hold a valid Hawaii driver\'s license' },
                    { key: 'vehicleRegistered', label: 'My vehicle is legally registered' },
                    { key: 'vehicleSafe', label: 'My vehicle is safe and roadworthy' },
                    { key: 'willRemoveUnsafe', label: 'I will remove my vehicle if unsafe' },
                    { key: 'hasInsurance', label: 'I maintain legally required auto insurance' },
                    { key: 'noInsuranceProvided', label: 'I understand Cruise LLC does not provide insurance coverage' },
                    { key: 'insuranceDenial', label: 'I understand I should confirm carpooling coverage with my insurer' },
                    { key: 'confirmedCoverage', label: 'I have reviewed my insurance coverage in relation to carpooling' },
                    { key: 'inherentRisk', label: 'Driving involves inherent risk' },
                    { key: 'passengersIndependent', label: 'Passengers are independent individuals' },
                    { key: 'accidentsMayOccur', label: 'Accidents and injuries may occur' },
                    { key: 'noBackgroundChecks', label: 'I understand that Cruise LLC is actively evaluating safety standards for community carpool coordination and I agree to exercise good judgment in my interactions' },
                    { key: 'responsibleInteractions', label: 'I am responsible for my interactions with passengers' },
                    { key: 'indemnify', label: 'I understand I may be required to indemnify Cruise LLC' },
                    { key: 'financialResponsibility', label: 'I accept financial responsibility for my actions' },
                    { key: 'accurateInfo', label: 'All information I provided is accurate' },
                    { key: 'violationRemoval', label: 'I understand violations may result in removal' },
                    { key: 'voluntaryParticipation', label: 'I voluntarily agree to participate' },
                    { key: 'keepQuietPlacesQuiet', label: 'Keep quiet places quiet: I agree not to disclose special spots to visitors, and only recommend well known tourist destinations' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-start space-x-2">
                      <Checkbox 
                        id={key}
                        checked={checkboxes[key]}
                        onCheckedChange={() => handleCheckboxChange(key)}
                        className="mt-0.5"
                      />
                      <Label htmlFor={key} className="cursor-pointer text-sm leading-tight">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="agree" 
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked)}
                />
                <Label htmlFor="agree" className="cursor-pointer font-semibold">
                  I have read and agree to the Driver Agreement
                </Label>
              </div>

              <Button
                onClick={handleAccept}
                disabled={!agreed || !allCheckboxesChecked || isSubmitting}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Accepting...' : 'Accept and Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <footer className="pt-6 border-t border-border text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Cruise LLC. All rights reserved.
        </footer>
      </div>
    </div>
  );
}