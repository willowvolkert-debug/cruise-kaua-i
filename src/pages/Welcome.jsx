import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Shield, MessageSquare, Users, DollarSign, Clock, Leaf, HandHeart, CheckCircle, AlertCircle, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WelcomePage() {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Track page view
    const trackView = async () => {
      try {
        const sessionId = sessionStorage.getItem('session_id') || Math.random().toString(36).substring(7);
        sessionStorage.setItem('session_id', sessionId);
        
        const isAuthenticated = await base44.auth.isAuthenticated();
        let userId = null;
        if (isAuthenticated) {
          const user = await base44.auth.me();
          userId = user?.id;
        }
        
        await base44.entities.PageView.create({
          page_name: "Welcome",
          user_id: userId,
          session_id: sessionId
        });
      } catch (e) {
        console.error("Error tracking page view:", e);
      }
    };
    trackView();
  }, []);

  const handleSignUp = () => {
    base44.auth.redirectToLogin(createPageUrl("Trips"));
  };

  const handleExplore = () => {
    navigate(createPageUrl("Trips") + "?explore=true");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl border-gray-200 rounded-3xl bg-white">
        <CardContent className="p-8 md:p-12 text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-secondary">Welcome to Cruise Kauaʻi!</h1>
          </div>

          <div className="space-y-4 py-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              We are a community-based ridesharing app aimed at reducing traffic on Kauaʻi. Make money on your grocery runs or commutes by posting the rides you're already taking on the app. Riders can look at all rides on any date, or request a ride, paying a reasonable fare ($5-30) to get to their destination. Mahalo for being a part of the movement to reduce traffic, build community & make transportation more accessible on Kauaʻi!
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleSignUp}
              size="lg" 
              className="w-full bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-2xl font-semibold"
            >
              sign up here!
            </Button>
            
            <Button 
              onClick={handleExplore}
              size="lg"
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-6 text-lg rounded-2xl"
            >
              not ready to sign up? explore the app here.
            </Button>
          </div>

          <div className="pt-6 space-y-3">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>verified drivers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>secure payments</span>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-green-600" />
                <span>eco-friendly</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}