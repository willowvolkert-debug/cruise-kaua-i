// Shared Twilio helpers for notification functions.

export function normalizePhone(phone: string): string {
  let n = (phone || '').replace(/\D/g, '');
  if (n.length === 10) n = '+1' + n;
  else if (!n.startsWith('+')) n = '+' + n;
  return n;
}

// Texts each user once (deduped by phone number). Returns how many sent.
export async function sendSmsToUsers(users: any[], body: string) {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
  if (!accountSid || !authToken || !fromNumber) return { sent: 0, total: users.length, error: 'Twilio not configured' };

  const seen = new Set<string>();
  let sent = 0;
  for (const u of users) {
    if (!u.phone_number) continue;
    const to = normalizePhone(u.phone_number);
    if (seen.has(to)) continue;
    seen.add(to);
    try {
      const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ From: fromNumber, To: to, Body: body }).toString(),
      });
      if (resp.ok) sent++;
    } catch (_) { /* skip failed recipient */ }
  }
  return { sent, total: seen.size };
}

// Which side of Kauaʻi a coordinate is on.
export function kauaiSide(lat: number, lng: number): 'north' | 'east' | 'south' | 'west' {
  if (lat >= 22.12) return 'north';
  if (lng <= -159.52) return 'west';
  if (lat <= 21.92) return 'south';
  return 'east';
}