import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Shield, MessageSquare, Users, DollarSign, Clock, Leaf, HandHeart, CheckCircle, AlertCircle, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WelcomePage() {
  const navigate = useNavigate();

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
            <h1 className="text-5xl md:text-6xl font-bold text-secondary">cruise kauaʻi</h1>
            <p className="text-xl text-gray-600 italic">sharing aloha one ride at a time</p>
          </div>

          <div className="space-y-4 py-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              Making transportation on Kauaʻi more <span className="font-semibold text-gray-500">social</span>, 
              <span className="font-semibold text-blue-600"> affordable</span>, and 
              <span className="font-semibold text-green-600"> sustainable</span>!
            </p>
            <p className="text-gray-600">
              Share rides with kamaʻāina (residents) and malihini (visitors) to reduce the number of cars on our roads and build community connections across the island. 🚗💨
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