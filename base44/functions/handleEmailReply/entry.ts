import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse incoming email webhook (supports SendGrid, Mailgun, Postmark formats)
    const body = await req.json();
    
    let fromEmail = '';
    let fromName = '';
    let subject = '';
    let message = '';
    
    // SendGrid format
    if (body.from) {
      fromEmail = body.from;
      fromName = body.from.split('<')[0].trim() || body.from;
      subject = body.subject || 'Reply to Setup Reminder';
      message = body.text || body.html || '';
    }
    // Mailgun format
    else if (body.sender) {
      fromEmail = body.sender;
      fromName = body.from || body.sender;
      subject = body.subject || 'Reply to Setup Reminder';
      message = body['body-plain'] || body['body-html'] || '';
    }
    // Postmark format
    else if (body.FromFull) {
      fromEmail = body.FromFull.Email;
      fromName = body.FromFull.Name || body.FromFull.Email;
      subject = body.Subject || 'Reply to Setup Reminder';
      message = body.TextBody || body.HtmlBody || '';
    }
    
    if (!fromEmail || !message) {
      return Response.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    // Find user by email
    const users = await base44.asServiceRole.entities.User.list();
    const user = users.find(u => u.email.toLowerCase() === fromEmail.toLowerCase());
    
    // Check if this is a recurring ride confirmation reply
    const messageLower = message.toLowerCase().trim();
    if (user && messageLower.includes('confirm') && (subject.includes('Confirm your ride') || subject.includes('recurring ride'))) {
      // Extract schedule_id and date from subject or message
      // Subject format: "⏰ Confirm your ride on 2026-06-10 - Cruise Kauaʻi"
      const dateMatch = subject.match(/Confirm your ride on (\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const dateStr = dateMatch[1];
        // Find the schedule for this user with this date
        const schedules = await base44.asServiceRole.entities.RecurringSchedule.list();
        const schedule = schedules.find(s => s.user_id === user.id);
        
        if (schedule) {
          // Confirm the ride using same logic as the button
          const confirmedDates = [...(schedule.confirmed_dates || [])];
          if (!confirmedDates.includes(dateStr)) {
            confirmedDates.push(dateStr);
            await base44.asServiceRole.entities.RecurringSchedule.update(schedule.id, { confirmed_dates: confirmedDates });
          }
          
          return Response.json({ 
            success: true,
            message: 'Recurring ride confirmed successfully',
            action: 'ride_confirmed',
            date: dateStr
          });
        }
      }
    }
    
    // Default: create inquiry from reply
    if (!user) {
      await base44.asServiceRole.entities.ContactInquiry.create({
        user_id: 'unknown',
        user_name: fromName,
        user_email: fromEmail,
        subject: `[Email Reply] ${subject}`,
        message: message,
        status: 'pending',
        priority: 'medium'
      });
    } else {
      await base44.asServiceRole.entities.ContactInquiry.create({
        user_id: user.id,
        user_name: user.full_name || fromName,
        user_email: fromEmail,
        subject: `[Email Reply] ${subject}`,
        message: message,
        status: 'pending',
        priority: 'medium'
      });
    }
    
    return Response.json({ 
      success: true,
      message: 'Email reply received and forwarded to admin'
    });
  } catch (error) {
    console.error('Error handling email reply:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});