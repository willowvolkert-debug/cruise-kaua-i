import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Admin-only: called by scheduled automation
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

        const allTransactions = await base44.asServiceRole.entities.Transaction.list();
        const allRides = await base44.asServiceRole.entities.Ride.list();
        const allUsers = await base44.asServiceRole.entities.User.list();
        
        const now = new Date();
        const pendingPayouts = [];

        for (const transaction of allTransactions) {
            if (transaction.payout_status !== 'pending' || transaction.transaction_status !== 'completed') continue;

            const ride = allRides.find(r => r.id === transaction.ride_id);
            if (!ride) continue;

            const rideDateTime = new Date(`${ride.departure_date}T${ride.departure_time}`);
            const hoursSinceRide = (now - rideDateTime) / (1000 * 60 * 60);
            if (hoursSinceRide < 24) continue;

            const driver = allUsers.find(u => u.id === transaction.recipient_id);
            if (!driver || !driver.stripe_connect_account_id || !driver.stripe_connect_onboarding_complete) continue;

            pendingPayouts.push({ transaction, driver });
        }

        const results = [];

        for (const { transaction, driver } of pendingPayouts) {
            try {
                await base44.asServiceRole.entities.Transaction.update(transaction.id, { payout_status: 'processing' });

                const payoutAmount = Math.round(transaction.ride_amount * 100);

                const transfer = await stripe.transfers.create({
                    amount: payoutAmount,
                    currency: 'usd',
                    destination: driver.stripe_connect_account_id,
                    description: `Payout for ride ${transaction.ride_id}`,
                    metadata: {
                        transaction_id: transaction.id,
                        booking_id: transaction.booking_id,
                        ride_id: transaction.ride_id,
                        driver_id: driver.id
                    }
                });

                await base44.asServiceRole.entities.Transaction.update(transaction.id, {
                    payout_status: 'completed',
                    payout_date: new Date().toISOString(),
                    stripe_transfer_id: transfer.id
                });

                await base44.asServiceRole.entities.User.update(driver.id, {
                    total_payouts: (driver.total_payouts || 0) + transaction.ride_amount
                });

                try {
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: driver.email,
                        subject: '💰 Payout processed - Cruise Kauaʻi',
                        body: `Aloha ${driver.full_name},\n\nGreat news! Your payout of $${transaction.ride_amount.toFixed(2)} has been processed and is on its way to your bank account.\n\nIt should arrive within 2-3 business days.\n\nMahalo for driving with Cruise Kauaʻi!\n\nCruise Kauaʻi Team`
                    });
                } catch (emailError) {
                    console.error('Email error:', emailError);
                }

                results.push({ transaction_id: transaction.id, driver_name: driver.full_name, amount: transaction.ride_amount, status: 'success' });

            } catch (error) {
                console.error(`Payout failed for transaction ${transaction.id}:`, error);
                await base44.asServiceRole.entities.Transaction.update(transaction.id, {
                    payout_status: 'failed',
                    payout_failure_reason: error.message
                });
                results.push({ transaction_id: transaction.id, driver_name: driver?.full_name, status: 'failed', error: error.message });
            }
        }

        return Response.json({ success: true, processed: results.length, results });

    } catch (error) {
        console.error('Automated payout error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});