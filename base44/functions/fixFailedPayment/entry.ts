import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe';
import { carpoolConnectFee } from '../../shared/fees.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { booking_id } = await req.json();
    if (!booking_id) return Response.json({ error: 'booking_id required' }, { status: 400 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Get the booking
    const bookings = await base44.asServiceRole.entities.RideBooking.filter({ id: booking_id });
    const booking = bookings[0];
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    // Search Stripe for checkout sessions with this booking_id in metadata
    const sessions = await stripe.checkout.sessions.list({ limit: 100 });
    const matchingSessions = sessions.data.filter(s => s.metadata?.booking_id === booking_id);

    // Also search payment intents by booking_id metadata
    const paymentIntents = await stripe.paymentIntents.list({ limit: 100 });
    const matchingPIs = paymentIntents.data.filter(pi => pi.metadata?.booking_id === booking_id);

    const result = {
      booking_id,
      db_payment_status: booking.payment_status,
      checkout_sessions_found: matchingSessions.length,
      payment_intents_found: matchingPIs.length,
    };

    let stripePaid = false;
    let stripeChargeId = null;
    let totalPaid = null;

    // Check checkout sessions first
    if (matchingSessions.length > 0) {
      const session = matchingSessions[0];
      result.stripe_session_id = session.id;
      result.stripe_session_payment_status = session.payment_status;
      result.stripe_session_status = session.status;
      result.stripe_session_amount = session.amount_total ? session.amount_total / 100 : null;
      result.stripe_session_pi = session.payment_intent;
      result.stripe_session_created = new Date(session.created * 1000).toISOString();
      if (session.payment_status === 'paid') {
        stripePaid = true;
        stripeChargeId = session.payment_intent;
        totalPaid = session.amount_total ? session.amount_total / 100 : booking.total_amount;
      }
    }

    // If not paid via session, check payment intents by metadata
    if (!stripePaid && matchingPIs.length > 0) {
      const pi = matchingPIs[0];
      result.stripe_pi_id = pi.id;
      result.stripe_pi_status = pi.status;
      result.stripe_pi_amount = pi.amount_received ? pi.amount_received / 100 : null;
      result.stripe_pi_created = new Date(pi.created * 1000).toISOString();
      if (pi.status === 'succeeded') {
        stripePaid = true;
        stripeChargeId = pi.id;
        totalPaid = pi.amount_received ? pi.amount_received / 100 : booking.total_amount;
      }
    }

    // If still not found, search by customer email (PI/charge may not have booking_id metadata)
    if (!stripePaid) {
      const passengers = await base44.asServiceRole.entities.User.filter({ id: booking.passenger_id });
      const passenger = passengers[0];
      if (passenger?.email) {
        result.search_email = passenger.email;
        // List recent charges and filter by amount + email in memory
        try {
          const allCharges = await stripe.charges.list({ limit: 100 });
          result.list_charge_count = allCharges.data.length;
          // Match by billing_details.email or receipt_email
          const matchedCharges = allCharges.data.filter(c =>
            c.status === 'succeeded' && c.paid &&
            (c.receipt_email === passenger.email ||
             c.billing_details?.email === passenger.email)
          );
          if (matchedCharges.length > 0) {
            const c = matchedCharges[0];
            result.stripe_charge_id = c.id;
            result.stripe_charge_amount = c.amount / 100;
            result.stripe_charge_created = new Date(c.created * 1000).toISOString();
            stripePaid = true;
            stripeChargeId = c.id;
            totalPaid = c.amount / 100;
          }
        } catch (listErr) {
          result.list_charge_error = listErr.message;
        }
        // Also try payment intents list (for cases where charge lookup missed)
        if (!stripePaid) {
          try {
            const allPIs = await stripe.paymentIntents.list({ limit: 100 });
            result.list_pi_count = allPIs.data.length;
            const matchedPIs = allPIs.data.filter(pi =>
              pi.receipt_email === passenger.email && pi.status === 'succeeded'
            );
            if (matchedPIs.length > 0) {
              const pi = matchedPIs[0];
              result.stripe_fallback_pi_id = pi.id;
              result.stripe_fallback_pi_status = pi.status;
              result.stripe_fallback_pi_amount = pi.amount_received ? pi.amount_received / 100 : null;
              result.stripe_fallback_pi_created = new Date(pi.created * 1000).toISOString();
              stripePaid = true;
              stripeChargeId = pi.id;
              totalPaid = pi.amount_received ? pi.amount_received / 100 : booking.total_amount;
            }
          } catch (piListErr) {
            result.list_pi_error = piListErr.message;
          }
        }
      }
    }

    if (!stripePaid) {
      return Response.json({
        ...result,
        stripe_found: false,
        message: 'No successful Stripe payment found for this booking (checked sessions, payment intents, and charges).'
      });
    }

    // If Stripe says paid but our DB says failed, fix it
    if (stripePaid && booking.payment_status !== 'paid') {
      const ride_id = booking.ride_id;
      const passenger_id = booking.passenger_id;
      const driver_id = booking.driver_id;

      // Get ride + driver details
      const rides = await base44.asServiceRole.entities.Ride.filter({ id: ride_id });
      const ride = rides[0];
      const actualDriverId = ride?.driver_id || driver_id;
      const drivers = await base44.asServiceRole.entities.User.filter({ id: actualDriverId });
      const driver = drivers[0];
      const passengers = await base44.asServiceRole.entities.User.filter({ id: passenger_id });
      const passenger = passengers[0];

      const rideAmount = booking.total_amount;
      const connectFee = carpoolConnectFee(passenger?.has_hawaii_id === true, rideAmount);

      // Update booking to paid
      await base44.asServiceRole.entities.RideBooking.update(booking_id, {
        payment_status: 'paid',
        stripe_charge_id: stripeChargeId,
        payment_failure_reason: null,
        initial_notification_sent: true
      });

      // Create transaction if it doesn't exist
      const existingTxns = await base44.asServiceRole.entities.Transaction.filter({ booking_id });
      if (existingTxns.length === 0) {
        await base44.asServiceRole.entities.Transaction.create({
          booking_id,
          ride_id,
          payer_id: passenger_id,
          payer_name: passenger?.full_name || booking.passenger_name,
          recipient_id: actualDriverId,
          recipient_name: driver?.full_name || 'Driver',
          ride_amount: rideAmount,
          connect_fee: connectFee,
          total_amount: totalPaid,
          payment_method_last4: 'card',
          payment_method_brand: 'Card',
          transaction_status: 'completed',
          stripe_charge_id: stripeChargeId
        });
      }

      // Send driver notification email (HTML template)
      if (driver?.email) {
        try {
          const driverFirstName = driver.username || driver.full_name?.split(' ')[0] || 'there';
          const riderUsername = booking.passenger_username || booking.passenger_name;
          const riderMessage = booking.description || 'No message provided';
          const payoutDisplay = `$${rideAmount.toFixed(2)}`;

          await base44.asServiceRole.integrations.Core.SendEmail({
            to: driver.email,
            from_name: "Cruise Hawaiʻi",
            subject: `🚗 New ride request from ${booking.passenger_name}!`,
            body: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td align="center" style="padding:32px 24px 20px;border-bottom:1px solid #f0ebe0;">
          <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Hawaiʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #e8742a;display:block;margin:0 auto 10px;" />
          <div style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;">Cruise Hawaiʻi</div>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h1 style="font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#1a1a1a;margin:0 0 12px;">You've got a rider, ${driverFirstName}! 🎉</h1>
          <p style="font-size:0.95rem;line-height:1.7;color:#444;margin:0 0 20px;"><strong>${booking.passenger_name}</strong> has requested a seat on your upcoming drive. They've already paid — you just need to confirm.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff8f0,#fff3e6);border:2px solid #e8742a;border-radius:12px;margin:0 0 20px;">
            <tr><td style="padding:18px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="auto" style="padding-right:16px;">
                    <div style="font-size:0.7rem;color:#aaa;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">YOUR PAYOUT</div>
                    <div style="font-family:Georgia,serif;font-size:2.2rem;font-weight:700;color:#e8742a;line-height:1;">${payoutDisplay}</div>
                  </td>
                  <td style="font-size:0.82rem;color:#666;line-height:1.5;border-left:1px solid #f0d0b0;padding-left:16px;">Released to you once the rider confirms the trip is complete.<br>The rider has already paid.</td>
                </tr>
              </table>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid #ede5d4;border-radius:12px;margin:0 0 20px;">
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">📍</span><strong>Route:</strong> ${ride?.departure_location || '—'} → ${ride?.destination || '—'}</td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">📅</span><strong>Date:</strong> ${ride?.departure_date || '—'} at ${ride?.departure_time || '—'}</td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">🪑</span><strong>Seats:</strong> ${booking.seats_booked}</td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid #ede5d4;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">🙋</span><strong>Rider:</strong> ${riderUsername}</td></tr>
            <tr><td style="padding:14px 20px;font-size:0.9rem;color:#444;"><span style="margin-right:8px;">💬</span><strong>Message:</strong> ${riderMessage}</td></tr>
          </table>
          <p style="font-size:0.88rem;line-height:1.6;color:#666;margin:0 0 24px;background:#fff8f0;border-left:3px solid #e8742a;border-radius:0 8px 8px 0;padding:12px 16px;">Log in to <strong>accept or decline within 24 hours.</strong> If you don't respond, the request will expire and the rider will be refunded.</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0;">
              <a href="https://cruisehi.org/inbox" style="display:inline-block;background:#e8742a;color:#ffffff;text-decoration:none;font-weight:600;font-size:1rem;padding:14px 32px;border-radius:50px;margin:4px 8px;">View Request →</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#faf7f2;border-top:1px solid #ede5d4;padding:20px 32px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:0.95rem;color:#888;font-style:italic;margin:0 0 8px;">Mahalo nui loa 🌺</p>
          <p style="font-size:0.78rem;color:#aaa;line-height:1.6;margin:0;">— The Cruise Hawaiʻi Team · <a href="https://cruisehi.org/" style="color:#e8742a;text-decoration:none;">cruisehi.org</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
          });
        } catch (e) {
          console.error('Email error:', e.message);
        }
      }

      result.fixed = true;
      result.message = 'Payment was confirmed in Stripe. Booking updated to paid, transaction created, and driver notified.';
    } else if (stripePaid && booking.payment_status === 'paid') {
      result.fixed = false;
      result.message = 'Stripe shows paid and DB already shows paid — no fix needed.';
    } else {
      result.fixed = false;
      result.message = `Stripe payment not confirmed (sessions: ${matchingSessions.length}, PIs: ${matchingPIs.length}) — payment did not actually complete.`;
    }

    return Response.json(result);
  } catch (error) {
    console.error('fixFailedPayment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});