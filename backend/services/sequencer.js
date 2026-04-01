/**
 * buildSequence(debtor)
 *
 * Returns an array of 120 scheduled contact objects for a debtor.
 * 1 contact per day at 10:00 AM, alternating channels: call, sms, email.
 *
 * Stage 1 (days 1–14):   layer = 1   — 14 contacts
 * Stage 2 (days 15–60):  layer = 2   — 46 contacts
 * Stage 3 (days 61–120): layer = 3   — 60 contacts
 * Total: 120 contacts over 120 days
 */
function buildSequence(debtor) {
  const CHANNELS = ['call', 'sms', 'email'];
  const now = new Date();
  const contacts = [];

  for (let day = 1; day <= 120; day++) {
    // Determine layer based on day range
    let layer;
    if (day <= 14) layer = 1;
    else if (day <= 60) layer = 2;
    else layer = 3;

    // Alternate channels: call, sms, email, call, sms, email...
    const channel = CHANNELS[(day - 1) % 3];

    // Schedule at 10:00 AM, offset by `day` days from now
    const date = new Date(now);
    date.setDate(date.getDate() + day);
    date.setHours(10, 0, 0, 0);

    contacts.push({
      step:         day,
      channel,
      scheduledFor: date.toISOString(),
      layer,
    });
  }

  return contacts;
}

module.exports = { buildSequence };
