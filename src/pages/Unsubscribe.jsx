import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";
import { unsubscribeSetupReminders } from "@/functions/unsubscribeSetupReminders";

export default function UnsubscribePage() {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleUnsubscribe = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('user_id');

        if (!userId) {
          setStatus('error');
          setMessage('Invalid unsubscribe link. Missing user ID.');
          return;
        }

        const { data } = await unsubscribeSetupReminders({ user_id: userId });
        
        if (data.success) {
          setStatus('success');
          setMessage('You have been unsubscribed from all automated emails.');
        } else {
          setStatus('error');
          setMessage('Failed to unsubscribe. Please try again or contact support.');
        }
      } catch (error) {
        console.error('Unsubscribe error:', error);
        setStatus('error');
        setMessage('An error occurred. Please try again later.');
      }
    };

    handleUnsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
      <Card className="max-w-md w-full shadow-xl border-gray-200 rounded-3xl bg-white">
        <CardHeader>
          <CardTitle className="text-2xl text-secondary text-center">
            Unsubscribe from Automated Emails
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 p-8">
          {status === 'loading' && (
            <div className="py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-600 mt-4">Processing...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-4">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <p className="text-lg text-gray-700 mb-4">{message}</p>
              <p className="text-sm text-gray-600">
                You will no longer receive automated emails from Cruise Kauaʻi (daily ride updates, setup reminders, and community blasts).
              </p>
              <p className="text-sm text-gray-600 mt-2">
                You can update your email preferences anytime on your Account page.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <p className="text-lg text-gray-700 mb-4">{message}</p>
              <p className="text-sm text-gray-600">
                If you continue to have issues, please contact us through the app.
              </p>
            </div>
          )}

          <div className="pt-4">
            <Button
              onClick={() => window.location.href = 'https://ride-connect-b7a57d59.base44.app'}
              className="bg-primary hover:bg-primary/90 rounded-2xl"
            >
              Return to Cruise Kauaʻi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}