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
    
    if (!user) {
      // Create inquiry from unknown user
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
      // Create inquiry from known user
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