import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, CreditCard } from "lucide-react";
import { format } from "date-fns";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const allTransactions = await base44.entities.Transaction.list('-created_date');
      const userTransactions = allTransactions.filter(
        t => t.payer_id === user.id || t.recipient_id === user.id
      );
      setTransactions(userTransactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
    setIsLoading(false);
  };

  const getTransactionType = (transaction) => {
    if (!currentUser) return 'unknown';
    return transaction.payer_id === currentUser.id ? 'payment' : 'earning';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return <p>Loading transaction history...</p>;
  }

  if (transactions.length === 0) {
    return (
      <Card className="border-dashed border-gray-200">
        <CardContent className="p-8 text-center">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No transactions yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {transactions.map(transaction => {
          const type = getTransactionType(transaction);
          const isPayment = type === 'payment';
          
          return (
            <Card key={transaction.id} className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isPayment ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {isPayment ? (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-secondary">
                        {isPayment ? `Payment to ${transaction.recipient_name}` : `Payment from ${transaction.payer_name}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(transaction.created_date), "MMM d, yyyy • h:mm a")}
                      </p>
                      {transaction.payment_method_brand && transaction.payment_method_last4 && (
                        <p className="text-xs text-gray-400">
                          {transaction.payment_method_brand} •••• {transaction.payment_method_last4}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${isPayment ? 'text-red-600' : 'text-green-600'}`}>
                      {isPayment ? '-' : '+'}${transaction.total_amount.toFixed(2)}
                    </p>
                    <Badge className={getStatusColor(transaction.transaction_status)}>
                      {transaction.transaction_status}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Ride amount:</span>
                    <span>${transaction.ride_amount.toFixed(2)}</span>
                  </div>
                  {isPayment && (
                    <div className="flex justify-between">
                      <span>Connect fee (10%):</span>
                      <span>${transaction.connect_fee.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}