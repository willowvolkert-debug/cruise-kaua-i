import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Trash2, Star, Lock, Loader2 } from "lucide-react";
import { createSetupIntent } from "@/functions/createSetupIntent";
import { savePaymentMethod } from "@/functions/savePaymentMethod";

const STRIPE_PUBLISHABLE_KEY = "pk_test_51SC94PLTsbLecFgZNL9kvcsgP3kOkf1P7DvUaW00zboNcA2yPiUAomnAFYYdlNynuQfGF8oBfh4RyaPlQuK0jCWK005GMUb5Qf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PaymentMethodsManager() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [newCard, setNewCard] = useState({
    name: '',
    number: '',
    expiry: '',
    cvc: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const allPaymentMethods = await base44.entities.PaymentMethod.list();
      const userMethods = allPaymentMethods.filter(pm => pm.user_id === user.id);
      setPaymentMethods(userMethods);
    } catch (error) {
      console.error("Error loading payment methods:", error);
    }
    setIsLoading(false);
  };

  const handleInputChange = (e) => {
    let { id, value } = e.target;

    if (id === 'number') {
      value = value.replace(/[^\d]/g, '').slice(0, 16);
      const formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
      setNewCard(prev => ({ ...prev, [id]: formattedValue }));
    } else if (id === 'expiry') {
      value = value.replace(/[^\d]/g, '').slice(0, 4);
      const formattedValue = value.replace(/(\d{2})(\d)/, '$1 / $2');
      setNewCard(prev => ({ ...prev, [id]: formattedValue }));
    } else if (id === 'cvc') {
      value = value.replace(/[^\d]/g, '').slice(0, 4);
      setNewCard(prev => ({ ...prev, [id]: value }));
    } else {
      setNewCard(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Load Stripe.js if not already loaded
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

      // Create setup intent on backend
      const { data: setupData } = await createSetupIntent({});
      
      if (setupData.error) {
        throw new Error(setupData.error);
      }

      const [exp_month, exp_year] = newCard.expiry.split(' / ');

      // Create payment method with Stripe
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card: {
          number: newCard.number.replace(/\s/g, ''),
          exp_month: parseInt(exp_month),
          exp_year: parseInt('20' + exp_year),
          cvc: newCard.cvc
        },
        billing_details: {
          name: newCard.name
        }
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      // Confirm setup intent
      const { setupIntent, error: confirmError } = await stripe.confirmCardSetup(
        setupData.clientSecret,
        {
          payment_method: paymentMethod.id
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Save payment method details to our database
      const { data: savedMethod } = await savePaymentMethod({ 
        payment_method_id: paymentMethod.id 
      });

      if (savedMethod.error) {
        throw new Error(savedMethod.error);
      }

      const isFirstCard = paymentMethods.length === 0;

      await base44.entities.PaymentMethod.create({
        user_id: currentUser.id,
        card_last4: savedMethod.card_last4,
        card_brand: savedMethod.card_brand,
        exp_month: savedMethod.exp_month,
        exp_year: savedMethod.exp_year,
        cardholder_name: newCard.name,
        is_default: isFirstCard,
        stripe_payment_method_id: savedMethod.stripe_payment_method_id
      });

      setNewCard({ name: '', number: '', expiry: '', cvc: '' });
      setShowAddModal(false);
      loadData();
    } catch (error) {
      console.error("Error adding payment method:", error);
      alert("Error adding payment method: " + error.message);
    }

    setIsSubmitting(false);
  };

  const handleSetDefault = async (methodId) => {
    try {
      // Unset all current defaults
      for (const method of paymentMethods.filter(pm => pm.is_default)) {
        await base44.entities.PaymentMethod.update(method.id, { is_default: false });
      }

      // Set new default
      await base44.entities.PaymentMethod.update(methodId, { is_default: true });
      loadData();
    } catch (error) {
      console.error("Error setting default:", error);
    }
  };

  const handleRemove = async (methodId) => {
    if (!confirm("Are you sure you want to remove this payment method?")) return;

    try {
      await base44.entities.PaymentMethod.delete(methodId);
      loadData();
    } catch (error) {
      console.error("Error removing payment method:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-secondary">payment methods</h3>
        <Button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-primary/90 rounded-2xl">
          <Plus className="w-4 h-4 mr-2" />
          add card
        </Button>
      </div>

      {isLoading ? (
        <p>Loading payment methods...</p>
      ) : paymentMethods.length === 0 ? (
        <Card className="border-dashed border-gray-200">
          <CardContent className="p-8 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No payment methods added yet</p>
            <Button onClick={() => setShowAddModal(true)} variant="outline" className="rounded-2xl">
              <Plus className="w-4 h-4 mr-2" />
              add your first card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paymentMethods.map(method => (
            <Card key={method.id} className={method.is_default ? "border-primary border-2" : "border-gray-200"}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-secondary">
                          {method.card_brand} •••• {method.card_last4}
                        </p>
                        {method.is_default && (
                          <Badge className="bg-primary rounded-2xl">
                            <Star className="w-3 h-3 mr-1" />
                            default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {method.cardholder_name} • Expires {method.exp_month}/{method.exp_year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                        className="rounded-2xl border-gray-300"
                      >
                        set as default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(method.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-2xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Card Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-secondary">
              add payment method
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddCard} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">cardholder name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newCard.name}
                onChange={handleInputChange}
                required
                className="rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">card number</Label>
              <Input
                id="number"
                placeholder="0000 0000 0000 0000"
                value={newCard.number}
                onChange={handleInputChange}
                maxLength="19"
                required
                className="rounded-2xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">expiry date</Label>
                <Input
                  id="expiry"
                  placeholder="MM / YY"
                  value={newCard.expiry}
                  onChange={handleInputChange}
                  maxLength="7"
                  required
                  className="rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">cvc</Label>
                <Input
                  id="cvc"
                  placeholder="123"
                  value={newCard.cvc}
                  onChange={handleInputChange}
                  maxLength="4"
                  required
                  className="rounded-2xl"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Your payment information is encrypted and secure
            </p>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-2xl border-gray-300"
              >
                cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary hover:bg-primary/90 rounded-2xl"
              >
                {isSubmitting ? 'adding...' : 'add card'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}