import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertTriangle, CheckCircle, Clock, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { formatHST } from "@/lib/formatHST";

function getStatus(tx) {
  if (tx.transaction_status !== "completed") {
    return { label: "charge failed", color: "bg-red-100 text-red-700 border-red-300", icon: "error" };
  }
  if (tx.payout_status === "failed") {
    return { label: "⚠️ payout failed — driver not paid", color: "bg-red-100 text-red-800 border-red-300", icon: "error" };
  }
  if (tx.payout_status === "completed") {
    return { label: "driver paid out ✓", color: "bg-green-100 text-green-700 border-green-300", icon: "done" };
  }
  // charge succeeded but payout not yet done
  return { label: "$ in Cruise account — driver needs payout", color: "bg-amber-100 text-amber-800 border-amber-300", icon: "pending" };
}

export default function TransactionLedger() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    base44.entities.Transaction.list("-created_date", 100)
      .then(txs => {
        setTransactions(txs);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("TransactionLedger error:", err);
        setIsLoading(false);
      });
  }, []);

  const failedCount = transactions.filter(tx =>
    tx.payout_status === "failed" || tx.transaction_status !== "completed"
  ).length;

  const pendingPayoutCount = transactions.filter(tx =>
    tx.transaction_status === "completed" && tx.payout_status !== "completed" && tx.payout_status !== "failed"
  ).length;

  return (
    <Card className={`shadow-lg rounded-3xl ${failedCount > 0 ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <CardTitle className={`text-xl flex items-center justify-between ${failedCount > 0 ? "text-red-800" : "text-secondary"}`}>
          <div className="flex items-center gap-2">
            <DollarSign className={`w-6 h-6 ${failedCount > 0 ? "text-red-600" : "text-primary"}`} />
            transaction ledger
            <div className="flex gap-2 ml-2">
              {failedCount > 0 && (
                <Badge className="bg-red-600 text-white text-xs">{failedCount} issue{failedCount > 1 ? "s" : ""}</Badge>
              )}
              {pendingPayoutCount > 0 && (
                <Badge className="bg-amber-500 text-white text-xs">{pendingPayoutCount} pending payout{pendingPayoutCount > 1 ? "s" : ""}</Badge>
              )}
            </div>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="p-4 space-y-3">
          {isLoading && <p className="text-gray-500 text-sm text-center py-4">loading transactions...</p>}

          {!isLoading && transactions.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">no transactions yet</p>
          )}

          {!isLoading && transactions.map(tx => {
            const status = getStatus(tx);
            return (
              <div
                key={tx.id}
                className={`rounded-2xl border p-4 space-y-2 bg-white ${status.icon === "error" ? "border-red-200" : status.icon === "pending" ? "border-amber-200" : "border-gray-200"}`}
              >
                {/* Row 1: who paid who */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-secondary text-sm">{tx.payer_name}</span>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <span className="font-semibold text-secondary text-sm">{tx.recipient_name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{formatHST(tx.created_date, "MMM d, yyyy")}</span>
                </div>

                {/* Row 2: amounts */}
                <div className="flex gap-4 text-xs text-gray-600 flex-wrap">
                  <span>rider paid: <strong className="text-gray-800">${tx.total_amount?.toFixed(2)}</strong></span>
                  <span>ride amount: <strong className="text-gray-800">${tx.ride_amount?.toFixed(2)}</strong></span>
                  <span>connect fee: <strong className="text-gray-800">${tx.connect_fee?.toFixed(2)}</strong></span>
                </div>

                {/* Row 3: status badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-xs ${status.color}`}>
                    {status.icon === "done" && <CheckCircle className="w-3 h-3 mr-1" />}
                    {status.icon === "error" && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {status.icon === "pending" && <Clock className="w-3 h-3 mr-1" />}
                    {status.label}
                  </Badge>

                  {/* Stripe charge link */}
                  {tx.stripe_charge_id && (
                    <a
                      href={`https://dashboard.stripe.com/payments/${tx.stripe_charge_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline"
                    >
                      charge ↗
                    </a>
                  )}
                  {tx.stripe_transfer_id && (
                    <a
                      href={`https://dashboard.stripe.com/transfers/${tx.stripe_transfer_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline"
                    >
                      transfer ↗
                    </a>
                  )}
                </div>

                {/* Failure reason if present */}
                {tx.payout_failure_reason && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    {tx.payout_failure_reason}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}