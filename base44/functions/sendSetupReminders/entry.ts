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
            // Skip if unsubscribed
            if (u.setup_reminders_unsubscribed) return false;
            
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

                    const appUrl = 'https://ride-connect-b7a57d59.base44.app';
                    const unsubscribeUrl = `${appUrl}/unsubscribe?user_id=${u.id}`;

                    let setupSteps = '';
                    if (needsProfile || needsLicense || needsAgreements) {
                        setupSteps += `<div style="margin: 32px 0;">
                          <p style="font-size: 16px; font-weight: bold; margin-bottom: 16px;">🚗 1. BECOME A RIDER</p>
                          <p style="margin-bottom: 16px; padding-left: 20px;">
                            In order to be a rider, input your profile details such as name, age, and bio. Then, securely verify your license and identity using Stripe. Finally, sign our legal agreements such as Terms of Service and our Community Agreement. 
                          </p>
                          <p style="padding-left: 20px;">Now you are able to get rides around the island! 🏝️</p>
                        </div>`;
                    }

                    if (needsVehicle) {
                        setupSteps += `<div style="margin: 32px 0;">
                          <p style="font-size: 16px; font-weight: bold; margin-bottom: 16px;">💰 2. BECOME A DRIVER</p>
                          <p style="margin-bottom: 16px; padding-left: 20px;">
                            If you would like to be a driver and make money, upload your vehicle information, insurance information, and sign our Driver Agreement. 
                          </p>
                          <p style="padding-left: 20px;">Once this is uploaded, you will be a verified driver— making money, building community, and reducing traffic at the same time! ✨</p>
                        </div>`;
                    }

                    const emailBody = `
                    <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    
                    <p style="font-size: 18px; margin-bottom: 24px;">🌺 Aloha!</p>

                    <p style="margin-bottom: 20px;"><strong>This is Willow, founder & CEO of Cruise Kauaʻi.</strong> Mahalo for creating an account with us and being interested in reducing traffic on our small island. Cruise Kauaʻi is a transportation alternative for those sick of sitting in traffic and paying too much money to get around. It is like a combination of the bus, Uber, and the Nextdoor community app; a community-based ride-sharing platform to get cars off the road, put money in locals' pockets, and make transportation more affordable & accessible for everyone.</p>

                    <p style="margin-bottom: 24px;">I wanted to remind you to finish setting up your account. We need more drivers posting rides as we finish beta testing, and need your help to make the culture shift toward carpooling a reality on Kauaʻi!</p>

                    <hr style="border: none; border-top: 1px solid #ddd; margin: 32px 0;">

                    ${setupSteps}

                    <hr style="border: none; border-top: 1px solid #ddd; margin: 32px 0;">

                    <p style="margin-bottom: 16px; font-weight: bold;">We also have two new features on our app:</p>

                    <p style="margin-bottom: 12px;"><strong>(1) FIND A RIDE:</strong> riders can now browse all available rides in the trips tab without needing to search for a specific route. Simply open the app, tap "view all rides," and see all upcoming rides posted by drivers — making it easier than ever to find a trip that works for you.</p>

                    <p style="margin-bottom: 24px;"><strong>(2) RECURRING RIDES:</strong> drivers can now set up recurring rides when posting a trip. Simply fill out the recurring ride tab under "post a ride" with your morning commute or daily grocery run. Then, press on that ride and it will populate below, and the only field you have to fill out is the date.</p>

                    <p style="margin-top: 40px; margin-bottom: 8px;">Mahalo for joining cruise kauaʻi and helping our island home 🙏</p>
                    <p style="margin: 0;">Founder & CEO,</p>
                    <p style="margin: 0; font-weight: bold;">Willow</p>

                    <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0;">

                    <p style="font-size: 12px; color: #666; margin-bottom: 12px;">If you'd like to stop receiving these setup reminders, <a href="${unsubscribeUrl}" style="color: #0066cc;">click here</a>.</p>

                    <p style="font-size: 13px; color: #666; margin-bottom: 8px;">Not sure how to use the app? <a href="https://cruisekauai.base44.app/Welcome" style="color:#3b82f6;">Re-watch our welcome flow here</a>.</p>
                    <p style="font-size: 12px; color: #999;">Replies to this email are not monitored. Please fill out the contact us form on the Cruise Kauaʻi website, or email willowvolkert@gmail.com, with any questions or concerns.</p>
                    </body>
                    </html>
                    `.trim();

                    await base44.asServiceRole.integrations.Core.SendEmail({
                        from_name: 'Cruise Kauaʻi',
                        to: u.email,
                        subject: '🌺 Finish setting up your Cruise Kauaʻi Carpooling Account Today!',
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