import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STRIPE_PUBLISHABLE_KEY = "pk_test_51SC94PLTsbLecFgZNL9kvcsgP3kOkf1P7DvUaW00zboNcA2yPiUAomnAFYYdlNynuQfGF8oBfh4RyaPlQuK0jCWK005GMUb5Qf";

export default function StripePaymentForm({ amount, bookingId, rideId, onSuccess, onCancel }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    exp_month: '',
    exp_year: '',
    cvc: '',
    name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Load Stripe.js
      if (!window.Stripe) {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);

      // Create payment intent on backend
      const { data: intentData } = await base44.functions.invoke('createPaymentIntent', {
        amount,
        booking_id: bookingId,
        ride_id: rideId,
        description: `Cruise Hawaiʻi ride booking`
      });

      if (intentData.error) {
        throw new Error(intentData.error);
      }

      // Create payment method
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card: {
          number: cardDetails.number.replace(/\s/g, ''),
          exp_month: parseInt(cardDetails.exp_month),
          exp_year: parseInt(cardDetails.exp_year),
          cvc: cardDetails.cvc
        },
        billing_details: {
          name: cardDetails.name
        }
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      // Confirm the payment
      const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
        intentData.clientSecret,
        {
          payment_method: paymentMethod.id
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        onSuccess({
          paymentIntentId: paymentIntent.id,
          amount: amount,
          last4: cardDetails.number.slice(-4),
          brand: paymentMethod.card.brand
        });
      } else {
        throw new Error('Payment was not successful. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
        <Lock className="w-5 h-5 text-blue-600" />
        <p className="text-sm text-blue-800">Your payment is secured with Stripe encryption</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="card-name">Name on Card</Label>
        <Input
          id="card-name"
          placeholder="John Doe"
          value={cardDetails.name}
          onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
          required
          className="rounded-2xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="card-number">Card Number</Label>
        <div className="relative">
          <Input
            id="card-number"
            placeholder="4242 4242 4242 4242"
            value={cardDetails.number}
            onChange={(e) => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
            maxLength={19}
            required
            className="rounded-2xl pl-10"
          />
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="exp-month">Month</Label>
          <Input
            id="exp-month"
            placeholder="MM"
            value={cardDetails.exp_month}
            onChange={(e) => setCardDetails({ ...cardDetails, exp_month: e.target.value.slice(0, 2) })}
            maxLength={2}
            required
            className="rounded-2xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exp-year">Year</Label>
          <Input
            id="exp-year"
            placeholder="YY"
            value={cardDetails.exp_year}
            onChange={(e) => setCardDetails({ ...cardDetails, exp_year: e.target.value.slice(0, 2) })}
            maxLength={2}
            required
            className="rounded-2xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cvc">CVC</Label>
          <Input
            id="cvc"
            placeholder="123"
            value={cardDetails.cvc}
            onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value.slice(0, 4) })}
            maxLength={4}
            required
            className="rounded-2xl"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Total Amount:</span>
          <span className="text-2xl font-bold text-primary">${amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 rounded-2xl"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-primary hover:bg-primary/90 rounded-2xl"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}