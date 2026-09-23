// Merges registered users + launch signup emails for newsletter blasts.
// Deduplicates by email — launch signups already in the user list are skipped.
// Each recipient has: { email, full_name, id, source }

export async function getNewsletterRecipients(base44) {
  const [users, launchSignups] = await Promise.all([
    base44.asServiceRole.entities.User.list(),
    base44.asServiceRole.entities.LaunchSignup.list(),
  ]);

  const eligibleUsers = users
    .filter(u => u.email && u.email_update_frequency !== 'never')
    .map(u => ({ email: u.email, full_name: u.full_name || '', id: u.id, source: 'user' }));

  const existingEmails = new Set(eligibleUsers.map(u => u.email.toLowerCase()));

  const launchRecipients = launchSignups
    .filter(s => s.email && !existingEmails.has(s.email.toLowerCase()))
    .map(s => ({ email: s.email, full_name: s.name || '', id: s.id, source: 'launch_signup' }));

  return [...eligibleUsers, ...launchRecipients];
}