/**
 * buildSequence(debtor)
 *
 * Returns an array of scheduled contact objects with a natural cadence:
 *
 * STAGE 1 (Days 1–14, layer=1, friendly):
 *   7-day repeating pattern with pauses and call+sms combos
 *   ~14 contacts in 14 days
 *
 * STAGE 2 (Days 15–60, layer=2, direct):
 *   Every day, alternating call/sms/email — 46 contacts
 *
 * STAGE 3 (Days 61–120, layer=3, urgent):
 *   Every day, SMS-heavy pattern — 60 contacts
 *
 * Day 150: Final layer=4 SMS (after 30-day pause)
 */
function buildSequence(debtor) {
  const now = new Date();
  const contacts = [];
  let step = 0;

  function addContact(day, hour, channel, layer) {
    step++;
    const date = new Date(now);
    date.setDate(date.getDate() + day);
    date.setHours(hour, 0, 0, 0);
    contacts.push({ step, channel, scheduledFor: date.toISOString(), layer });
  }

  // ─── STAGE 1 (Days 1–14, layer=1) ─────────────────────────────────────────
  // 7-day repeating pattern:
  //   Day 1: call 10AM + sms 3PM
  //   Day 2: sms 10AM
  //   Day 3: PAUSE
  //   Day 4: email 10AM
  //   Day 5: sms 10AM
  //   Day 6: PAUSE
  //   Day 7: call 10AM + sms 3PM
  for (let week = 0; week < 2; week++) {
    const base = week * 7;
    // Day 1/8: call + sms
    addContact(base + 1, 10, 'call', 1);
    addContact(base + 1, 15, 'sms',  1);
    // Day 2/9: sms
    addContact(base + 2, 10, 'sms',  1);
    // Day 3/10: PAUSE
    // Day 4/11: email
    addContact(base + 4, 10, 'email', 1);
    // Day 5/12: sms
    addContact(base + 5, 10, 'sms',  1);
    // Day 6/13: PAUSE
    // Day 7/14: call + sms
    addContact(base + 7, 10, 'call', 1);
    addContact(base + 7, 15, 'sms',  1);
  }

  // ─── STAGE 2 (Days 15–60, layer=2) ────────────────────────────────────────
  // Every day, alternating: call, sms, email
  const STAGE2_CHANNELS = ['call', 'sms', 'email'];
  for (let day = 15; day <= 60; day++) {
    const channel = STAGE2_CHANNELS[(day - 15) % 3];
    addContact(day, 10, channel, 2);
  }

  // ─── STAGE 3 (Days 61–120, layer=3) ───────────────────────────────────────
  // Every day, SMS-heavy: sms, sms, call, sms, sms, email
  const STAGE3_CHANNELS = ['sms', 'sms', 'call', 'sms', 'sms', 'email'];
  for (let day = 61; day <= 120; day++) {
    const channel = STAGE3_CHANNELS[(day - 61) % 6];
    addContact(day, 10, channel, 3);
  }

  // ─── FINAL (Day 150, layer=4) ─────────────────────────────────────────────
  // 30-day pause then one last SMS
  addContact(150, 10, 'sms', 4);

  return contacts;
}

module.exports = { buildSequence };
