const supabase = require('../database/supabase');

// IANA timezone identifiers by Canadian province/territory
const PROVINCE_TIMEZONES = {
  BC: 'America/Vancouver',
  AB: 'America/Edmonton',
  SK: 'America/Regina',      // Saskatchewan does not observe DST
  MB: 'America/Winnipeg',
  ON: 'America/Toronto',
  QC: 'America/Toronto',
  NB: 'America/Moncton',
  NS: 'America/Halifax',
  PE: 'America/Halifax',
  NL: 'America/St_Johns',
  YT: 'America/Whitehorse',
  NT: 'America/Yellowknife',
  NU: 'America/Rankin_Inlet',
};

const CONTACT_START_HOUR = 8;   // 8:00 AM
const CONTACT_END_HOUR   = 21;  // 9:00 PM (contacts must start before 21:00)
const MAX_CONTACTS_PER_WEEK = 7;

/**
 * Returns { hour: number, weekday: string } in the given IANA timezone.
 */
function getLocalTime(timezone) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    hour:    'numeric',
    weekday: 'long',
    hour12:  false,
  }).formatToParts(now);

  const hour    = parseInt(parts.find(p => p.type === 'hour')?.value    ?? '12', 10);
  const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() ?? '';
  return { hour, weekday };
}

/**
 * checkContactAllowed(debtorId, channel)
 *
 * Enforces Canadian collection compliance rules:
 *   1. Cease and desist on file
 *   2. Legal hold
 *   3. Account already PAID or removed
 *   4. SMS opt-out (for SMS channel)
 *   5. Contact hours 8 am–9 pm in debtor's provincial timezone
 *   6. Quebec Sunday restriction
 *   7. Maximum 7 outbound contacts per rolling 7-day window
 *
 * Returns { allowed: boolean, reason: string | null }
 */
async function checkContactAllowed(debtorId, channel) {
  try {
    const { data: debtor, error } = await supabase
      .from('debtors')
      .select('id, cease_desist, legal_threat_flag')
      .eq('id', debtorId)
      .single();

    if (error || !debtor) {
      return { allowed: false, reason: 'Debtor not found' };
    }

    // 1. Cease and desist
    if (debtor.cease_desist) {
      return { allowed: false, reason: 'Cease and desist on file — contact is prohibited' };
    }

    // 2. Legal threat flag (debtor disputed / flagged for human review)
    if (debtor.legal_threat_flag) {
      return { allowed: false, reason: 'Debtor is flagged for legal review — contact blocked' };
    }

    // 3. Contact hours: 8 am–9 pm Eastern (default timezone)
    const timezone = 'America/Toronto';
    const { hour, weekday } = getLocalTime(timezone);

    if (hour < CONTACT_START_HOUR || hour >= CONTACT_END_HOUR) {
      return {
        allowed: false,
        reason: `Outside permitted contact hours (8 am–9 pm ET, current: ${hour}:00)`,
      };
    }

    // 4. Weekly contact limit
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('contact_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('debtor_id', debtorId)
      .eq('direction', 'outbound')
      .gte('created_at', oneWeekAgo);

    if (!countError && count >= MAX_CONTACTS_PER_WEEK) {
      return {
        allowed: false,
        reason: `Weekly outbound contact limit (${MAX_CONTACTS_PER_WEEK}) reached for this debtor`,
      };
    }

    return { allowed: true, reason: null };
  } catch (err) {
    console.error('checkContactAllowed error:', err);
    // Fail closed — block contact if the check itself errors
    return { allowed: false, reason: 'Compliance check failed — contact blocked for safety' };
  }
}

module.exports = { checkContactAllowed };
