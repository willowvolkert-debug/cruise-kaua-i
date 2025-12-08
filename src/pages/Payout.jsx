import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createConnectAccount } from "@/functions/createConnectAccount";
import { checkConnectStatus } from "@/functions/checkConnectStatus";

export default function PayoutPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [connectStatus, setConnectStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Check Connect status if user has account
      if (currentUser.stripe_connect_account_id) {
        await checkStatus();
      }
    } catch (e) {
      console.error(e);
      setError("Error loading user data.");
    }
    setIsLoading(false);
  };

  const checkStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const { data } = await checkConnectStatus();
      setConnectStatus(data);
      
      // Refresh user data if status changed
      if (data.onboarding_complete) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      }
    } catch (error) {
      console.error("Error checking Connect status:", error);
    }
    setIsCheckingStatus(false);
  };

  const handleConnectOnboarding = async () => {
    setError('');
    setIsCreatingAccount(true);
    
    try {
      const appUrl = window.location.origin;
      const { data } = await createConnectAccount({
        refresh_url: `${appUrl}/payout?refresh=true`,
        return_url: `${appUrl}/payout?success=true`
      });

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Connect onboarding
      window.location.href = data.url;
    } catch (error) {
      console.error("Error creating Connect account:", error);
      setError("Error setting up payout account. Please try again.");
      setIsCreatingAccount(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const isOnboardingComplete = user?.stripe_connect_onboarding_complete || connectStatus?.onboarding_complete;

  return (
    <div className="p-4 md:p-8 bg-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary">payout settings</h1>
          <p className="text-gray-600">connect your bank account to receive ride earnings automatically</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-border bg-white rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-secondary">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              stripe connect account
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {isOnboardingComplete ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Payout Account Active</p>
                      <p className="text-sm text-green-700">
                        Your bank account is connected via Stripe Connect
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-600">active</Badge>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-3">
                    <strong>How it works:</strong> Payouts are processed automatically 24 hours after ride completion. 
                    Funds arrive in your bank account within 2-3 business days.
                  </p>
                  <p className="text-xs text-blue-700">
                    Total earned: ${(user.total_payouts || 0).toFixed(2)}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={checkStatus}
                    disabled={isCheckingStatus}
                    variant="outline"
                    className="flex-1"
                  >
                    {isCheckingStatus ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        checking...
                      </>
                    ) : (
                      'refresh status'
                    )}
                  </Button>
                  <Button
                    onClick={handleConnectOnboarding}
                    disabled={isCreatingAccount}
                    variant="outline"
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    manage account
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-700" />
                  <AlertDescription className="text-yellow-800">
                    You must connect a bank account via Stripe Connect to receive payouts from rides you drive. 
                    This is required to post rides.
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold mb-3 text-secondary">What is Stripe Connect?</p>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>✓ Secure bank account connection</li>
                    <li>✓ Automatic payouts 24hrs after rides</li>
                    <li>✓ 2-3 business day transfers</li>
                    <li>✓ Tax forms (1099s) handled automatically</li>
                    <li>✓ Industry-standard security</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <p className="font-semibold mb-2">What you'll need:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Bank account information (routing & account number)</li>
                    <li>Social Security Number or EIN</li>
                    <li>Date of birth</li>
                    <li>Home address</li>
                  </ul>
                  <p className="mt-3 text-xs">This information is securely stored by Stripe and never shared.</p>
                </div>

                <Button
                  onClick={handleConnectOnboarding}
                  disabled={isCreatingAccount}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isCreatingAccount ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      redirecting to stripe...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      connect bank account with stripe
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  You'll be securely redirected to Stripe to complete setup
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <footer className="pt-6 border-t border-border text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Cruise Kauaʻi. All rights reserved.
        </footer>
      </div>
    </div>
  );
}