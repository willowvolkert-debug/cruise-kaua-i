import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpRight, ArrowDownLeft, CreditCard, ChevronDown, ChevronRight, MapPin, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [rideDetails, setRideDetails] = useState(null);
  const [isLoadingRide, setIsLoadingRide] = useState(false);

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

  const handleTransactionClick = async (transaction) => {
    setSelectedTransaction(transaction);
    setIsLoadingRide(true);
    try {
      if (transaction.ride_id) {
        const ride = await base44.entities.Ride.get(transaction.ride_id);
        setRideDetails(ride);
      }
    } catch (error) {
      console.error("Error loading ride details:", error);
      setRideDetails(null);
    }
    setIsLoadingRide(false);
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading transactions...</p>;
  }

  return (
    <>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">transaction history</span>
          <Badge variant="outline" className="rounded-2xl border-gray-300 text-gray-600">
            {transactions.length}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            transactions.map(transaction => {
              const type = getTransactionType(transaction);
              const isPayment = type === 'payment';
              
              return (
                <button
                  key={transaction.id}
                  onClick={() => handleTransactionClick(transaction)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-gray-100 hover:shadow-sm transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isPayment ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        {isPayment ? (
                          <ArrowUpRight className="w-4 h-4 text-red-600" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-secondary text-sm">
                          {isPayment ? transaction.recipient_name : transaction.payer_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(transaction.created_date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isPayment ? 'text-red-600' : 'text-green-600'}`}>
                        {isPayment ? '-' : '+'}${isPayment ? transaction.total_amount.toFixed(2) : transaction.ride_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      <Dialog open={!!selectedTransaction} onOpenChange={() => { setSelectedTransaction(null); setRideDetails(null); }}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-secondary">
              transaction details
            </DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4 py-2">
              {/* Transaction Summary */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      getTransactionType(selectedTransaction) === 'payment' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {getTransactionType(selectedTransaction) === 'payment' ? (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-secondary">
                        {getTransactionType(selectedTransaction) === 'payment' 
                          ? `Payment to ${selectedTransaction.recipient_name}` 
                          : `Payment from ${selectedTransaction.payer_name}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(selectedTransaction.created_date), "MMM d, yyyy • h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ride amount:</span>
                    <span className="font-medium">${selectedTransaction.ride_amount?.toFixed(2)}</span>
                  </div>
                  {getTransactionType(selectedTransaction) === 'payment' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Connect fee:</span>
                      <span className="font-medium">${selectedTransaction.connect_fee?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="font-semibold text-secondary">Total:</span>
                    <span className={`font-bold text-lg ${
                      getTransactionType(selectedTransaction) === 'payment' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {getTransactionType(selectedTransaction) === 'payment' ? '-' : '+'}$
                      {getTransactionType(selectedTransaction) === 'payment' 
                        ? selectedTransaction.total_amount?.toFixed(2) 
                        : selectedTransaction.ride_amount?.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <Badge className={getStatusColor(selectedTransaction.transaction_status)}>
                    {selectedTransaction.transaction_status}
                  </Badge>
                  {selectedTransaction.payment_method_brand && selectedTransaction.payment_method_last4 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {selectedTransaction.payment_method_brand} •••• {selectedTransaction.payment_method_last4}
                    </p>
                  )}
                </div>
              </div>

              {/* Ride Details */}
              {isLoadingRide ? (
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-center">
                  <p className="text-sm text-blue-700">Loading ride details...</p>
                </div>
              ) : rideDetails ? (
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <p className="font-semibold text-secondary mb-3">ride details</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{rideDetails.departure_location} → {rideDetails.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{format(new Date(rideDetails.departure_date), "EEEE, MMMM d, yyyy")}</span>
                    </div>
                    {rideDetails.departure_time && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{rideDetails.departure_time}</span>
                      </div>
                    )}
                    {rideDetails.car_model && (
                      <p className="text-gray-600 mt-2">Vehicle: {rideDetails.car_model}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                  <p className="text-sm text-gray-500">Ride details not available</p>
                </div>
              )}

              <Button
                onClick={() => { setSelectedTransaction(null); setRideDetails(null); }}
                className="w-full bg-primary hover:bg-primary/90 rounded-2xl"
              >
                close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}