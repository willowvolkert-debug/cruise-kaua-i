import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check if request is from admin/system
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        // Get all users who aren't registered as driver or rider
        const allUsers = await base44.asServiceRole.entities.User.list();
        
        // Count user types
        const registeredUsers = allUsers.filter(u => u.user_type === 'driver' || u.user_type === 'rider');
        const drivers = allUsers.filter(u => u.user_type === 'driver');
        const riders = allUsers.filter(u => u.user_type === 'rider');
        const unsubscribed = allUsers.filter(u => u.setup_reminders_unsubscribed).length;
        
        const incompleteUsers = allUsers.filter(u => {
            // Skip if unsubscribed from setup reminders
            if (u.setup_reminders_unsubscribed) return false;
            // Skip if user opted out of all automated emails
            if (u.email_update_frequency === 'never') return false;
            
            // Send to anyone who is NOT a driver or rider
            return u.user_type !== 'driver' && u.user_type !== 'rider';
        });
        
        console.log(`Total users: ${allUsers.length}`);
        console.log(`Registered users (${registeredUsers.length}):`);
        registeredUsers.forEach(u => {
            console.log(`  - ${u.full_name} (${u.email}) - ${u.user_type}`);
        });
        console.log(`Unsubscribed: ${unsubscribed}`);
        console.log(`Eligible for reminders: ${incompleteUsers.length}`);

        let sentCount = 0;
        const errors = [];

        for (const u of incompleteUsers) {
            try {
                const createdDate = new Date(u.created_date);
                const lastReminderDate = u.last_setup_reminder_sent ? new Date(u.last_setup_reminder_sent) : null;
                const hoursSinceCreated = (now - createdDate) / (1000 * 60 * 60);
                const daysSinceCreated = Math.floor(hoursSinceCreated / 24);
                
                let shouldSend = false;

                // First reminder: send immediately to everyone who hasn't received one yet
                if (!lastReminderDate) {
                    shouldSend = true;
                }
                // Subsequent reminders: every other day (2 days)
                else if (lastReminderDate) {
                    const hoursSinceLastReminder = (now - lastReminderDate) / (1000 * 60 * 60);
                    const daysSinceLastReminder = Math.floor(hoursSinceLastReminder / 24);
                    
                    if (daysSinceLastReminder >= 2) {
                        shouldSend = true;
                    }
                }

                if (shouldSend) {
                    // Determine what steps are missing
                    const needsProfile = !u.profile_complete;
                    const needsLicense = !u.drivers_license_verified;
                    const needsAgreements = !u.terms_accepted || !u.privacy_policy_accepted || !u.community_agreement_accepted;
                    const needsVehicle = !u.vehicle_verified;

                    const unsubscribeUrl = `https://cruisekauai.org/Unsubscribe?user_id=${u.id}`;

                    const appUrl = 'https://cruisekauai.org';
                    const setupUrl = `${appUrl}/account?reopen_quiz=true`;
                    const setupSteps = `
                    <div style="text-align: center; margin: 36px 0;">
                      <a href="${setupUrl}" style="display: inline-block; background-color: #2e7d52; color: #ffffff; font-size: 18px; font-weight: bold; padding: 18px 40px; border-radius: 50px; text-decoration: none; letter-spacing: 0.5px;">
                        finish setting up your profile →
                      </a>
                    </div>`;

                    const firstName = u.full_name?.split(' ')[0] || 'there';
                    const emailBody = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td align="center" style="padding:32px 24px 20px;border-bottom:1px solid #f0ebe0;">
          <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Hawaiʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #2f7d52;display:block;margin:0 auto 10px;" />
          <div style="font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#1a1a1a;">Cruise Hawaiʻi</div>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h1 style="font-family:Georgia,serif;font-size:1.5rem;font-weight:700;color:#1a1a1a;margin:0 0 16px;">Aloha, ${firstName}! 🌺</h1>

          <p style="font-size:0.95rem;line-height:1.8;color:#444;margin:0 0 16px;"><strong>This is Willow, founder of Cruise Hawaiʻi.</strong> Mahalo for creating an account with us! Cruise Hawaiʻi is a community carpooling service — like a combination of the bus, Uber, and Nextdoor. It connects drivers on the routes they're already taking with folks who need a ride. It gets cars off the road, puts money in locals' pockets, and makes transportation more affordable &amp; accessible for everyone on our island.</p>

          <p style="font-size:0.95rem;line-height:1.8;color:#444;margin:0 0 24px;">We'd love to have you fully set up so you can start sharing rides with your community. It only takes a few minutes!</p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 28px;">
              <a href="${setupUrl}" style="display:inline-block;background:#2f7d52;color:#ffffff;text-decoration:none;font-weight:600;font-size:1rem;padding:14px 36px;border-radius:50px;">Finish Setting Up Your Account →</a>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f0ebe0;padding-top:24px;margin-top:4px;">
            <tr><td>
              <p style="font-size:0.95rem;font-weight:700;color:#1a1a1a;margin:0 0 16px;">✨ What's new on Cruise Hawaiʻi:</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid #ede5d4;border-radius:12px;margin:0 0 16px;">
                <tr><td style="padding:16px 20px;border-bottom:1px solid #ede5d4;">
                  <p style="margin:0 0 6px;font-weight:700;color:#2f7d52;font-size:0.95rem;">💸 Price Offers</p>
                  <p style="margin:0;font-size:0.9rem;line-height:1.7;color:#555;">Riders can now make a custom price offer when booking a seat. If the driver's listed price doesn't work for you, simply name your price — the driver can accept, decline, or request the full amount. Great for making rides work for everyone's budget.</p>
                </td></tr>
                <tr><td style="padding:16px 20px;">
                  <p style="margin:0 0 6px;font-weight:700;color:#2f7d52;font-size:0.95rem;">🔁 Recurring Rides</p>
                  <p style="margin:0;font-size:0.9rem;line-height:1.7;color:#555;">Drivers can save their regular routes and auto-post rides on a weekly or custom schedule — perfect for daily commutes or regular errands. Set it once and let the app handle the rest.</p>
                </td></tr>

              </table>

              <p style="font-size:0.9rem;line-height:1.7;color:#666;margin:0 0 8px;">Not sure how to use the app? <a href="https://www.cruisekauai.org/Welcome?tutorial=true" style="color:#2f7d52;font-weight:600;">Re-watch the welcome tutorial →</a></p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#faf7f2;border-top:1px solid #ede5d4;padding:20px 32px;text-align:center;">
          <p style="font-size:0.75rem;color:#bbb;margin:4px 0 0;">Replies to this email are not monitored — contact us at <a href="mailto:willowvolkert@gmail.com" style="color:#bbb;">willowvolkert@gmail.com</a> with any questions.</p>
          <p style="font-size:0.75rem;margin:8px 0 0;"><a href="${unsubscribeUrl}" style="color:#bbb;text-decoration:none;">unsubscribe from setup reminders</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

                    await base44.asServiceRole.integrations.Core.SendEmail({
                        from_name: 'Cruise Hawaiʻi',
                        to: u.email,
                        subject: '🌺 Finish setting up your Cruise Hawaiʻi Carpooling Account Today!',
                        body: emailBody
                    });

                    // Update last reminder sent
                    await base44.asServiceRole.entities.User.update(u.id, {
                        last_setup_reminder_sent: now.toISOString()
                    });

                    sentCount++;
                }
            } catch (err) {
                errors.push({ user: u.email, error: err.message });
            }
        }

        return Response.json({
            success: true,
            sent: sentCount,
            checked: incompleteUsers.length,
            totalUsers: allUsers.length,
            registeredUsers: registeredUsers.map(u => ({
                name: u.full_name,
                email: u.email,
                type: u.user_type
            })),
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});