import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This function should be called by a scheduled job/cron
        // For security, you could add an API key check here
        
        // Find all transactions that need payout (24hrs+ after ride completion)
        const allTransactions = await base44.asServiceRole.entities.Transaction.list();
        const allRides = await base44.asServiceRole.entities.Ride.list();
        const allUsers = await base44.asServiceRole.entities.User.list();
        
        const now = new Date();
        const pendingPayouts = [];

        for (const transaction of allTransactions) {
            // Skip if already paid out or not completed
            if (transaction.payout_status !== 'pending' || transaction.transaction_status !== 'completed') {
                continue;
            }

            // Get ride details
            const ride = allRides.find(r => r.id === transaction.ride_id);
            if (!ride) continue;

            // Check if ride is completed and 24+ hours have passed
            const rideDateTime = new Date(`${ride.departure_date}T${ride.departure_time}`);
            const hoursSinceRide = (now - rideDateTime) / (1000 * 60 * 60);
            
            if (hoursSinceRide < 24) continue;

            // Get driver details
            const driver = allUsers.find(u => u.id === transaction.recipient_id);
            if (!driver || !driver.stripe_connect_account_id || !driver.stripe_connect_onboarding_complete) {
                continue;
            }

            pendingPayouts.push({ transaction, driver });
        }

        const results = [];

        // Process payouts
        for (const { transaction, driver } of pendingPayouts) {
            try {
                // Update status to processing
                await base44.asServiceRole.entities.Transaction.update(transaction.id, {
                    payout_status: 'processing'
                });

                // Calculate payout amount (ride_amount - already deducted connect fee)
                const payoutAmount = Math.round(transaction.ride_amount * 100); // Convert to cents

                // Create transfer to driver's Connect account
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

                // Update transaction with transfer details
                await base44.asServiceRole.entities.Transaction.update(transaction.id, {
                    payout_status: 'completed',
                    payout_date: new Date().toISOString(),
                    stripe_transfer_id: transfer.id
                });

                // Update driver's total payouts
                await base44.asServiceRole.entities.User.update(driver.id, {
                    total_payouts: (driver.total_payouts || 0) + (transaction.ride_amount)
                });

                // Send email notification to driver
                try {
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: driver.email,
                        subject: '💰 Payout processed - Cruise Kauaʻi',
                        body: `Aloha ${driver.full_name},\n\nGreat news! Your payout of $${(transaction.ride_amount).toFixed(2)} has been processed and is on its way to your bank account.\n\nIt should arrive within 2-3 business days.\n\nMahalo for driving with Cruise Kauaʻi!\n\nCruise Kauaʻi Team`
                    });
                } catch (emailError) {
                    console.error('Email error:', emailError);
                }

                results.push({
                    transaction_id: transaction.id,
                    driver_name: driver.full_name,
                    amount: transaction.ride_amount,
                    status: 'success'
                });

            } catch (error) {
                console.error(`Payout failed for transaction ${transaction.id}:`, error);
                
                // Update transaction with failure
                await base44.asServiceRole.entities.Transaction.update(transaction.id, {
                    payout_status: 'failed',
                    payout_failure_reason: error.message
                });

                results.push({
                    transaction_id: transaction.id,
                    driver_name: driver?.full_name,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            processed: results.length,
            results: results
        });

    } catch (error) {
        console.error('Automated payout error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});