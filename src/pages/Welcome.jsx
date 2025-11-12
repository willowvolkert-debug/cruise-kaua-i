
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Shield, MessageSquare, Users, DollarSign, Clock, Leaf, HandHeart, CheckCircle, Ship } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WelcomePage() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleComplete = async () => {
    try {
      await base44.auth.updateMe({ has_seen_welcome: true });
      navigate(createPageUrl("Account"));
    } catch (error) {
      console.error("Error updating welcome status:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Step 1: Introduction */}
        {step === 1 && (
          <Card className="shadow-xl border-gray-200 rounded-3xl bg-white">
            <CardContent className="p-8 md:p-12 text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-orange-400 rounded-full mx-auto flex items-center justify-center">
                <Ship className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-secondary">Welcome to Cruise Kauaʻi!</h1>
              <p className="text-xl text-gray-700 leading-relaxed">
                Making transportation on Kauaʻi more <span className="font-semibold text-gray-500">social</span>, 
                <span className="font-semibold text-blue-600"> affordable</span>, and 
                <span className="font-semibold text-green-600"> sustainable</span>.
              </p>
              <p className="text-gray-600">
                Share rides with kamaʻāina (residents) and malihini (visitors) to reduce the number of cars on our roads.
              </p>
              <Button onClick={() => setStep(2)} size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-2xl">
                Get Started
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Building Your Account */}
        {step === 2 && (
          <Card className="shadow-xl border-gray-200 rounded-3xl bg-white">
            <CardContent className="p-8 md:p-12 space-y-6">
              <h2 className="text-3xl font-bold text-secondary text-center">Build Your Profile</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <Shield className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-secondary">Verify Your License</h3>
                    <p className="text-gray-600">Upload photos of your driver's license for manual verification by our team.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <Car className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-secondary">Add Vehicle Details</h3>
                    <p className="text-gray-600">Share information about your vehicle, including photos and insurance.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <CheckCircle className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-secondary">Maintain Good Ratings</h3>
                    <p className="text-gray-600">Be respectful, punctual, and communicate clearly to build trust in our community.</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 rounded-2xl border-gray-300">Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1 bg-primary hover:bg-primary/90 rounded-2xl">Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: How to Use */}
        {step === 3 && (
          <Card className="shadow-xl border-gray-200 rounded-3xl bg-white">
            <CardContent className="p-8 md:p-12 space-y-6">
              <h2 className="text-3xl font-bold text-secondary text-center">How It Works</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <Users className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-secondary">Book a Trip</h3>
                    <p className="text-gray-600">Search for rides, view driver profiles, and request seats. Payment is processed automatically when your request is accepted.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-2xl border border-green-200">
                  <Car className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-secondary">Post a Ride</h3>
                    <p className="text-gray-600">Share your upcoming trips, set your price per seat, and connect with riders going your way.</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1 rounded-2xl border-gray-300">Back</Button>
                <Button onClick={() => setStep(4)} className="flex-1 bg-primary hover:bg-primary/90 rounded-2xl">Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Communication & Support */}
        {step === 4 && (
          <Card className="shadow-xl border-gray-200 rounded-3xl bg-white">
            <CardContent className="p-8 md:p-12 space-y-6">
              <h2 className="text-3xl font-bold text-secondary text-center">Communication & Support</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <MessageSquare className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-secondary">In-App Messaging</h3>
                    <p className="text-gray-600">Chat with drivers or riders directly in the app. Keep all communication within the platform for safety.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <Clock className="w-8 h-8 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-secondary">Ride Cancellations</h3>
                    <p className="text-gray-600">Cancel anytime with our flexible refund policy. Earlier cancellations receive higher refunds.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <HandHeart className="w-8 h-8 text-pink-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-secondary">Need Help?</h3>
                    <p className="text-gray-600">Visit our Contact Us page for any questions or concerns. Our team is here to help!</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => setStep(3)} variant="outline" className="flex-1 rounded-2xl border-gray-300">Back</Button>
                <Button onClick={() => setStep(5)} className="flex-1 bg-primary hover:bg-primary/90 rounded-2xl">Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Community Agreement */}
        {step === 5 && (
          <Card className="shadow-xl border-gray-200 rounded-3xl bg-white">
            <CardContent className="p-8 md:p-12 space-y-6">
              <h2 className="text-3xl font-bold text-secondary text-center">Our Community Values</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <Shield className="w-10 h-10 text-primary mb-2" />
                  <h3 className="font-semibold text-secondary">Safety First</h3>
                  <p className="text-sm text-gray-600">Verified drivers and secure payments</p>
                </div>
                <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <HandHeart className="w-10 h-10 text-pink-600 mb-2" />
                  <h3 className="font-semibold text-secondary">Respectful Shared Spaces</h3>
                  <p className="text-sm text-gray-600">Treat vehicles and fellow travelers with respect</p>
                </div>
                <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <DollarSign className="w-10 h-10 text-green-600 mb-2" />
                  <h3 className="font-semibold text-secondary">Shared Transportation Costs</h3>
                  <p className="text-sm text-gray-600">Fair cost-sharing, not profit-making</p>
                </div>
                <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <Leaf className="w-10 h-10 text-green-600 mb-2" />
                  <h3 className="font-semibold text-secondary">Less Cars on the Road</h3>
                  <p className="text-sm text-gray-600">Reduce traffic congestion on Kauaʻi</p>
                </div>
                <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <CheckCircle className="w-10 h-10 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-secondary">Cash-Free Payments</h3>
                  <p className="text-sm text-gray-600">Secure digital transactions only</p>
                </div>
                <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <MessageSquare className="w-10 h-10 text-primary mb-2" />
                  <h3 className="font-semibold text-secondary">Prompt & Clear Communication</h3>
                  <p className="text-sm text-gray-600">Keep others informed about your plans</p>
                </div>
                <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-2xl border border-gray-200 md:col-span-2">
                  <Clock className="w-10 h-10 text-orange-600 mb-2" />
                  <h3 className="font-semibold text-secondary">Punctuality & Flexibility</h3>
                  <p className="text-sm text-gray-600">Be on time and understanding of delays</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => setStep(4)} variant="outline" className="flex-1 rounded-2xl border-gray-300">Back</Button>
                <Button onClick={handleComplete} className="flex-1 bg-primary hover:bg-primary/90 rounded-2xl">
                  Let's Go!
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-all ${
                s === step ? 'bg-primary w-8' : s < step ? 'bg-primary/50' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
