
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle, AlertCircle, Building } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PayoutPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankData, setBankData] = useState({
    account_number: '',
    routing_number: '',
    account_holder_name: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      if (currentUser.bank_account_linked) {
        setBankData({
          account_number: '',
          routing_number: currentUser.bank_routing_number || '',
          account_holder_name: currentUser.full_name
        });
      } else {
        setBankData({
          account_number: '',
          routing_number: '',
          account_holder_name: currentUser.full_name
        });
      }
    } catch (e) {
      console.error(e);
      setError("Error loading user data.");
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!bankData.account_number || !bankData.routing_number) {
      setError("Please fill in all required fields.");
      return;
    }

    if (bankData.routing_number.length !== 9) {
      setError("Routing number must be exactly 9 digits.");
      return;
    }

    if (bankData.account_number.length < 8) {
      setError("Please enter a valid account number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const last4 = bankData.account_number.slice(-4);
      
      await base44.auth.updateMe({
        bank_account_linked: true,
        bank_account_last4: last4,
        bank_routing_number: bankData.routing_number
      });

      alert("Bank account linked successfully! You can now receive payouts.");
      await loadData();
      
      // Clear sensitive data
      setBankData(prev => ({
        ...prev,
        account_number: ''
      }));
    } catch (error) {
      console.error("Error linking bank account:", error);
      setError("Error linking bank account. Please try again.");
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary">payout settings</h1>
          <p className="text-gray-600">link your bank account to receive ride earnings</p>
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
              bank account
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {user?.bank_account_linked ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Bank Account Linked</p>
                      <p className="text-sm text-green-700">
                        Account ending in •••• {user.bank_account_last4}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Routing: {user.bank_routing_number}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-600">active</Badge>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Payouts are processed automatically 24 hours after ride completion. 
                    Funds typically arrive in 2-3 business days.
                  </p>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Need to update your bank account? Enter new details below:
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="routing">routing number *</Label>
                      <Input
                        id="routing"
                        type="text"
                        maxLength="9"
                        value={bankData.routing_number}
                        onChange={(e) => setBankData({...bankData, routing_number: e.target.value.replace(/\D/g, '')})}
                        placeholder="9 digit routing number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account">account number *</Label>
                      <Input
                        id="account"
                        type="text"
                        value={bankData.account_number}
                        onChange={(e) => setBankData({...bankData, account_number: e.target.value.replace(/\D/g, '')})}
                        placeholder="Your account number"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting ? 'updating...' : 'update bank account'}
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <Alert className="bg-yellow-50 border-yellow-200">
                  <Building className="h-4 w-4 text-yellow-700" />
                  <AlertDescription className="text-yellow-800">
                    You must link a bank account to receive payouts from rides you drive. 
                    Your information is encrypted and secure.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="holder">account holder name *</Label>
                  <Input
                    id="holder"
                    value={bankData.account_holder_name}
                    onChange={(e) => setBankData({...bankData, account_holder_name: e.target.value})}
                    placeholder="Full name on account"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="routing">routing number *</Label>
                  <Input
                    id="routing"
                    type="text"
                    maxLength="9"
                    value={bankData.routing_number}
                    onChange={(e) => setBankData({...bankData, routing_number: e.target.value.replace(/\D/g, '')})}
                    placeholder="9 digit routing number"
                    required
                  />
                  <p className="text-xs text-gray-500">Found on the bottom of your check</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account">account number *</Label>
                  <Input
                    id="account"
                    type="text"
                    value={bankData.account_number}
                    onChange={(e) => setBankData({...bankData, account_number: e.target.value.replace(/\D/g, '')})}
                    placeholder="Your account number"
                    required
                  />
                  <p className="text-xs text-gray-500">Also found on the bottom of your check</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                  <p className="font-semibold mb-2">🔒 Security & Privacy</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>All bank information is encrypted</li>
                    <li>We never store full account numbers</li>
                    <li>Only the last 4 digits are saved for reference</li>
                    <li>Used only for payout processing</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'linking...' : 'link bank account'}
                </Button>
              </form>
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
