/**
 * buildSequence(debtor)
 *
 * Returns scheduled contact objects with high-frequency cadence:
 * 6 contacts per day (3 calls + 3 SMS), plus 1 email.
 *
 * Daily pattern (Mon-Sat):
 *   8:00  call
 *   9:30  sms
 *   11:00 call
 *   13:00 sms
 *   15:00 call
 *   17:00 sms
 *   + 1 email at 10:00 AM every 3rd day
 *
 * STAGE 1 (Days 1–14, layer=1): friendly tone
 * STAGE 2 (Days 15–60, layer=2): direct tone
 * STAGE 3 (Days 61–120, layer=3): urgent tone
 * Day 150: Final layer=4 SMS (after 30-day pause)
 */
function buildSequence(debtor) {
  const now = new Date();
  const contacts = [];
  let step = 0;

  function addContact(day, hour, minute, channel, layer) {
    step++;
    const date = new Date(now);
    date.setDate(date.getDate() + day);
    date.setHours(hour, minute, 0, 0);
    contacts.push({ step, channel, scheduledFor: date.toISOString(), layer });
  }

  // Daily contact pattern: 3 calls + 3 SMS
  const DAILY_PATTERN = [
    { hour: 8,  min: 0,  channel: 'call' },
    { hour: 9,  min: 30, channel: 'sms'  },
    { hour: 11, min: 0,  channel: 'call' },
    { hour: 13, min: 0,  channel: 'sms'  },
    { hour: 15, min: 0,  channel: 'call' },
    { hour: 17, min: 0,  channel: 'sms'  },
  ];

  for (let day = 1; day <= 120; day++) {
    // Determine layer
    let layer;
    if (day <= 14) layer = 1;
    else if (day <= 60) layer = 2;
    else layer = 3;

    // 6 contacts per day (3 calls + 3 SMS)
    for (const slot of DAILY_PATTERN) {
      addContact(day, slot.hour, slot.min, slot.channel, layer);
    }

    // Add email every 3rd day at 10 AM
    if (day % 3 === 0) {
      addContact(day, 10, 0, 'email', layer);
    }
  }

  // Final SMS after 30-day pause (day 150)
  addContact(150, 10, 0, 'sms', 4);

  return contacts;
}

module.exports = { buildSequence };
