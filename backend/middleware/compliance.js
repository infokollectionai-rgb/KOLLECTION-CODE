const supabase = require('../database/supabase');

// IANA timezone identifiers by Canadian province/territory
const PROVINCE_TIMEZONES = {
  BC: 'America/Vancouver',
  AB: 'America/Edmonton',
  SK: 'America/Regina',
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

/**
 * Returns { hour, weekday, dayOfWeek } in the given IANA timezone.
 */
function getLocalTime(timezone) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    hour:    'numeric',
    weekday: 'long',
    hour12:  false,
  }).formatToParts(now);

  const hour    = parseInt(parts.find(p => p.type === 'hour')?.value ?? '12', 10);
  const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() ?? '';
  return { hour, weekday };
}

/**
 * checkContactAllowed(debtorId, channel)
 *
 * Enforces Canadian collection compliance rules:
 *   1. Cease and desist on file
 *   2. Legal threat flag
 *   3. Contact hours by province:
 *      - QC: Mon-Sat 8AM-8PM, NO Sundays
 *      - Other provinces: Mon-Sat 7AM-9PM, Sun 1PM-5PM
 *   4. No weekly contact limit (minimum 6 contacts/day: 3 calls + 3 SMS)
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

    // 3. Contact hours by province (default to Eastern/Ontario rules)
    const timezone = 'America/Toronto';
    const { hour, weekday } = getLocalTime(timezone);

    // Detect if Quebec (for now default to QC rules — can be refined with province field later)
    const isQuebec = true; // TODO: detect from debtor province when available

    if (weekday === 'sunday') {
      if (isQuebec) {
        return { allowed: false, reason: 'No contact permitted on Sundays in Quebec' };
      }
      // Other provinces: Sun 1PM-5PM only
      if (hour < 13 || hour >= 17) {
        return { allowed: false, reason: `Outside Sunday contact hours (1PM–5PM, current: ${hour}:00)` };
      }
    } else {
      // Mon-Sat
      const startHour = isQuebec ? 8 : 7;
      const endHour   = isQuebec ? 20 : 21;
      if (hour < startHour || hour >= endHour) {
        return {
          allowed: false,
          reason: `Outside permitted contact hours (${startHour}AM–${endHour === 20 ? '8PM' : '9PM'}, current: ${hour}:00)`,
        };
      }
    }

    // No weekly contact limit — minimum 6 contacts/day is enforced by sequencer

    return { allowed: true, reason: null };
  } catch (err) {
    console.error('checkContactAllowed error:', err);
    return { allowed: false, reason: 'Compliance check failed — contact blocked for safety' };
  }
}

module.exports = { checkContactAllowed };
