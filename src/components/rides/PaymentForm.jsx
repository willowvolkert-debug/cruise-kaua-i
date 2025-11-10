import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock, CreditCard, Loader2 } from 'lucide-react';
import { User } from "@/entities/all";

export default function PaymentForm({ amount, onPaymentSuccess, onBack }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasSavedCard, setHasSavedCard] = useState(false);
  const [useSavedCard, setUseSavedCard] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [savedCardInfo, setSavedCardInfo] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    name: '',
    number: '',
    expiry: '',
    cvc: ''
  });

  // Calculate fees
  const connectFee = amount * 0.10;
  const totalAmount = amount + connectFee;

  useEffect(() => {
    const loadSavedCard = async () => {
      try {
        const user = await User.me();
        if (user.saved_card_last4) {
          setHasSavedCard(true);
          setUseSavedCard(true);
          setSavedCardInfo({
            last4: user.saved_card_last4,
            brand: user.saved_card_brand,
            exp_month: user.saved_card_exp_month,
            exp_year: user.saved_card_exp_year
          });
        }
      } catch (error) {
        console.error("Error loading saved card:", error);
      }
    };
    loadSavedCard();
  }, []);

  const handleInputChange = (e) => {
    let { id, value } = e.target;

    // Basic formatting for card number and expiry
    if (id === 'number') {
      value = value.replace(/[^\d]/g, '').slice(0, 16);
      const formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
      setCardDetails(prev => ({ ...prev, [id]: formattedValue }));
    } else if (id === 'expiry') {
      value = value.replace(/[^\d]/g, '').slice(0, 4);
      const formattedValue = value.replace(/(\d{2})(\d)/, '$1 / $2');
      setCardDetails(prev => ({ ...prev, [id]: formattedValue }));
    } else if (id === 'cvc') {
      value = value.replace(/[^\d]/g, '').slice(0, 4);
      setCardDetails(prev => ({ ...prev, [id]: value }));
    } else {
      setCardDetails(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate Stripe API call
    setTimeout(async () => {
      // If save card is checked, save the card info
      if (saveCard && !useSavedCard) {
        const last4 = cardDetails.number.replace(/\s/g, '').slice(-4);
        const [exp_month, exp_year] = cardDetails.expiry.split(' / ');
        
        try {
          await User.updateMyUserData({
            saved_card_last4: last4,
            saved_card_brand: 'Visa', // In production, detect card brand
            saved_card_exp_month: exp_month,
            saved_card_exp_year: exp_year
          });
        } catch (error) {
          console.error("Error saving card:", error);
        }
      }

      setIsProcessing(false);
      onPaymentSuccess({ stripe_charge_id: `sim_charge_${Date.now()}` });
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       <Card className="bg-muted border-primary/20">
        <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-secondary">ride cost:</span>
                <span className="font-medium">${amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">cruise kauaʻi connect fee (10%):</span>
                <span className="font-medium">${connectFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-secondary font-semibold">total:</span>
                  <span className="text-2xl font-bold text-primary">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
        </CardContent>
      </Card>

      {hasSavedCard && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/30">
            <Checkbox 
              id="use-saved" 
              checked={useSavedCard}
              onCheckedChange={(checked) => setUseSavedCard(checked)}
            />
            <Label htmlFor="use-saved" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>{savedCardInfo?.brand} ending in {savedCardInfo?.last4}</span>
                <span className="text-sm text-gray-500">
                  (exp {savedCardInfo?.exp_month}/{savedCardInfo?.exp_year})
                </span>
              </div>
            </Label>
          </div>
        </div>
      )}

      {!useSavedCard && (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">name on card</Label>
            <Input id="name" placeholder="e.g. John Doe" required value={cardDetails.name} onChange={handleInputChange} disabled={isProcessing}/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="number">card number</Label>
            <div className="relative">
              <Input id="number" placeholder="0000 0000 0000 0000" required value={cardDetails.number} onChange={handleInputChange} maxLength="19" disabled={isProcessing}/>
              <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">expiry date</Label>
              <Input id="expiry" placeholder="MM / YY" required value={cardDetails.expiry} onChange={handleInputChange} maxLength="7" disabled={isProcessing}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">cvc</Label>
               <div className="relative">
                 <Input id="cvc" placeholder="123" required value={cardDetails.cvc} onChange={handleInputChange} maxLength="4" disabled={isProcessing}/>
                 <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="save-card" 
              checked={saveCard}
              onCheckedChange={(checked) => setSaveCard(checked)}
            />
            <Label htmlFor="save-card" className="text-sm cursor-pointer">
              save card for future payments
            </Label>
          </div>
        </>
      )}

      {useSavedCard && (
        <div className="space-y-2">
          <Label htmlFor="cvc">cvc</Label>
          <div className="relative">
            <Input id="cvc" placeholder="123" required value={cardDetails.cvc} onChange={handleInputChange} maxLength="4" disabled={isProcessing}/>
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row-reverse gap-2 pt-2">
        <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isProcessing}>
          {isProcessing ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> processing...</>
          ) : (
            `pay $${totalAmount.toFixed(2)}`
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto" disabled={isProcessing}>back</Button>
      </div>

       <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1.5 pt-2">
        <Lock className="w-3 h-3"/> this is a secure 128-bit ssl encrypted payment.
      </p>
    </form>
  );
}