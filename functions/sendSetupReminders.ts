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
        
        // Get all users who haven't completed setup
        const allUsers = await base44.asServiceRole.entities.User.list();
        const incompleteUsers = allUsers.filter(u => {
            // User is incomplete if they don't have all required fields
            const isIncomplete = !u.profile_complete || 
                                !u.drivers_license_verified || 
                                !u.terms_accepted || 
                                !u.privacy_policy_accepted || 
                                !u.community_agreement_accepted;
            
            // Skip if unsubscribed
            if (u.setup_reminders_unsubscribed) return false;
            
            return isIncomplete;
        });

        let sentCount = 0;
        const errors = [];

        for (const u of incompleteUsers) {
            try {
                const createdDate = new Date(u.created_date);
                const lastReminderDate = u.last_setup_reminder_sent ? new Date(u.last_setup_reminder_sent) : createdDate;
                const daysSinceCreated = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
                const daysSinceLastReminder = Math.floor((now - lastReminderDate) / (1000 * 60 * 60 * 24));

                let shouldSend = false;

                // First 2 weeks: send every other day (2 days)
                if (daysSinceCreated <= 14) {
                    if (daysSinceLastReminder >= 2) {
                        shouldSend = true;
                    }
                }
                // After 2 weeks: send once per week (7 days)
                else {
                    if (daysSinceLastReminder >= 7) {
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

                    let emailBody = `Hi ${u.full_name || 'there'}!\n\n`;
                    emailBody += `You started creating your Cruise Kauaʻi account, but you're not done yet! Complete your setup to start riding and driving around Kauaʻi.\n\n`;
                    
                    if (needsProfile || needsLicense || needsAgreements) {
                        emailBody += `🚗 TO BECOME A RIDER:\n`;
                        if (needsProfile) emailBody += `• Complete your profile (name, age, bio, photo)\n`;
                        if (needsLicense) emailBody += `• Verify your license using Stripe\n`;
                        if (needsAgreements) emailBody += `• Sign our legal agreements\n`;
                        emailBody += `\n`;
                    }

                    if (needsVehicle) {
                        emailBody += `💰 TO BECOME A DRIVER & EARN:\n`;
                        emailBody += `• Upload vehicle & insurance info\n`;
                        emailBody += `• Sign the Driver Agreement\n\n`;
                    }

                    emailBody += `Start your island adventure today! 🌺\n\n`;
                    emailBody += `👉 Log in now: ${appUrl}\n\n`;
                    emailBody += `---\n`;
                    emailBody += `Don't want these reminders? Unsubscribe: ${unsubscribeUrl}`;

                    await base44.asServiceRole.integrations.Core.SendEmail({
                        from_name: 'Cruise Kauaʻi',
                        to: u.email,
                        subject: '🌺 Finish Your Cruise Kauaʻi Account Setup!',
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
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});