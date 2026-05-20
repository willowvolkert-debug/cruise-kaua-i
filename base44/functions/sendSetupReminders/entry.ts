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

                    const unsubscribeUrl = `https://cruisekauai.org/Unsubscribe?user_id=${u.id}`;

                    const appUrl = 'https://cruisekauai.org';
                    let setupSteps = '';

                    if (needsProfile) {
                        setupSteps += `<div style="margin: 24px 0; padding: 20px; background: #faf7f2; border-left: 4px solid #e8742a; border-radius: 8px;">
                          <p style="font-size: 15px; font-weight: bold; margin: 0 0 12px; color: #1a1a1a;">👤 Step 1: Build Your Profile</p>
                          <p style="margin: 0 0 10px; color: #555;">Your profile helps drivers and riders know who they're sharing a ride with. Here's exactly what you need to fill in:</p>
                          <ul style="margin: 0 0 10px; padding-left: 20px; color: #555; line-height: 2;">
                            <li><strong>Username</strong> — a short handle others will see (e.g., @kaleo_808)</li>
                            <li><strong>Age</strong> — tap the age field and type your age as a number (e.g., 28). <em>Tip: if the field doesn't seem to respond, tap directly on the number box and type your age.</em></li>
                            <li><strong>Gender</strong> — tap the dropdown and select your option (Male, Female, or Non-binary)</li>
                            <li><strong>Bio</strong> — a sentence or two about yourself and why you use Cruise Kauaʻi</li>
                            <li><strong>Profile Photo</strong> — tap the camera icon on your avatar, choose a photo from your library, then tap "save changes." <em>Tip: make sure you tap "save changes" after selecting your photo or it won't upload.</em></li>
                          </ul>
                          <p style="margin: 0; color: #888; font-size: 13px;">→ <a href="${appUrl}/Account" style="color: #e8742a;">Go to your account to fill this out</a></p>
                        </div>`;
                    }

                    if (needsLicense) {
                        setupSteps += `<div style="margin: 24px 0; padding: 20px; background: #faf7f2; border-left: 4px solid #3b82f6; border-radius: 8px;">
                          <p style="font-size: 15px; font-weight: bold; margin: 0 0 12px; color: #1a1a1a;">🪪 Step 2: Verify Your Driver's License</p>
                          <p style="margin: 0 0 10px; color: #555;">This is required to book or post rides. It only takes about 2 minutes:</p>
                          <ol style="margin: 0 0 10px; padding-left: 20px; color: #555; line-height: 2;">
                            <li>Sign in to the app</li>
                            <li>Go to your <strong>Account</strong> page</li>
                            <li>Under "Verification," tap <strong>"Verify Now"</strong> next to Driver's License</li>
                            <li>Follow the secure Stripe Identity prompts to upload a photo of your license</li>
                            <li>Once submitted, Willow will review and approve it — usually within 24 hours</li>
                          </ol>
                          <p style="margin: 0; color: #888; font-size: 13px;">→ <a href="${appUrl}/Account" style="color: #3b82f6;">Tap here to go directly to license verification after signing in</a></p>
                        </div>`;
                    }

                    if (needsAgreements) {
                        setupSteps += `<div style="margin: 24px 0; padding: 20px; background: #faf7f2; border-left: 4px solid #10b981; border-radius: 8px;">
                          <p style="font-size: 15px; font-weight: bold; margin: 0 0 12px; color: #1a1a1a;">📄 Step 3: Sign Legal Agreements</p>
                          <p style="margin: 0 0 10px; color: #555;">You'll need to read and accept these three short agreements:</p>
                          <ul style="margin: 0 0 10px; padding-left: 20px; color: #555; line-height: 2;">
                            <li><a href="${appUrl}/TermsOfService" style="color: #10b981;">Terms of Service</a></li>
                            <li><a href="${appUrl}/PrivacyPolicy" style="color: #10b981;">Privacy Policy</a></li>
                            <li><a href="${appUrl}/CommunityAgreement" style="color: #10b981;">Community Agreement</a></li>
                          </ul>
                          <p style="margin: 0; color: #888; font-size: 13px;">→ Each has a green "Accept" button at the bottom. Tap it and you're done!</p>
                        </div>`;
                    }

                    if (needsVehicle) {
                        setupSteps += `<div style="margin: 24px 0; padding: 20px; background: #faf7f2; border-left: 4px solid #8b5cf6; border-radius: 8px;">
                          <p style="font-size: 15px; font-weight: bold; margin: 0 0 12px; color: #1a1a1a;">🚗 Step 4 (Optional): Become a Driver & Earn Money</p>
                          <p style="margin: 0 0 10px; color: #555;">Want to post rides and earn money? Complete these extra steps:</p>
                          <ul style="margin: 0 0 10px; padding-left: 20px; color: #555; line-height: 2;">
                            <li>Go to <a href="${appUrl}/VehicleDetails" style="color: #8b5cf6;"><strong>Vehicle Details</strong></a> and upload your car info + insurance</li>
                            <li>Sign the <a href="${appUrl}/DriverAgreement" style="color: #8b5cf6;"><strong>Driver Agreement</strong></a></li>
                            <li>Connect your bank account via Stripe for payouts</li>
                          </ul>
                          <p style="margin: 0; color: #888; font-size: 13px;">Once approved, you'll be able to post rides and earn money sharing your commute!</p>
                        </div>`;
                    }

                    const emailBody = `
                    <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.8; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    
                    <div style="text-align:center;margin-bottom:24px;">
                      <img src="https://media.base44.com/images/public/68d33be0c396daf5b7a57d59/98a38ac0b_cruisekauaiFINAL.jpg" alt="Cruise Kauaʻi" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #f97316;" />
                      <p style="margin:8px 0 0 0;font-weight:bold;color:#3b82f6;font-size:15px;">Cruise Kauaʻi</p>
                    </div>
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

                    <p style="font-size: 13px; color: #666; margin-bottom: 8px;">Not sure how to use the app? <a href="https://www.cruisekauai.org/Welcome?tutorial=true" style="color:#3b82f6;">Re-watch our welcome tutorial here →</a></p>
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