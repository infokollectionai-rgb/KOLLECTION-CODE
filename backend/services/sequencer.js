/**
 * buildSequence(debtor)
 *
 * Returns an array of scheduled contact objects for a debtor based on their tier.
 * Each object: { step, channel, scheduledFor (ISO string), layer }
 *
 * 7 steps per debtor, 2 contacts per day (every 12 hours), alternating channels.
 * All contacts start at 10:00 AM, second daily contact at 10:00 PM.
 *
 * Tier 1 (0–30 days overdue)  — gentle cadence, favour SMS/email
 * Tier 2 (31–60 days)         — accelerated, add calls
 * Tier 3 (61–90 days)         — urgent, lead with calls
 * Tier 4 (90+ days)           — final stage, max urgency
 */
function buildSequence(debtor) {
  const tier = Math.min(Math.max(parseInt(debtor.tier ?? 1, 10), 1), 4);

  // Schedules: array of { step, channel, hoursOffset (from now) }
  // 2 contacts per day = every 12 hours
  const SCHEDULES = {
    1: [
      { step: 1, channel: 'sms',   hoursOffset: 0  },
      { step: 2, channel: 'email', hoursOffset: 12 },
      { step: 3, channel: 'sms',   hoursOffset: 24 },
      { step: 4, channel: 'email', hoursOffset: 36 },
      { step: 5, channel: 'sms',   hoursOffset: 48 },
      { step: 6, channel: 'call',  hoursOffset: 60 },
      { step: 7, channel: 'sms',   hoursOffset: 72 },
    ],
    2: [
      { step: 1, channel: 'sms',   hoursOffset: 0  },
      { step: 2, channel: 'call',  hoursOffset: 12 },
      { step: 3, channel: 'email', hoursOffset: 24 },
      { step: 4, channel: 'sms',   hoursOffset: 36 },
      { step: 5, channel: 'call',  hoursOffset: 48 },
      { step: 6, channel: 'sms',   hoursOffset: 60 },
      { step: 7, channel: 'call',  hoursOffset: 72 },
    ],
    3: [
      { step: 1, channel: 'call',  hoursOffset: 0  },
      { step: 2, channel: 'sms',   hoursOffset: 12 },
      { step: 3, channel: 'call',  hoursOffset: 24 },
      { step: 4, channel: 'email', hoursOffset: 36 },
      { step: 5, channel: 'call',  hoursOffset: 48 },
      { step: 6, channel: 'sms',   hoursOffset: 60 },
      { step: 7, channel: 'call',  hoursOffset: 72 },
    ],
    4: [
      { step: 1, channel: 'call',  hoursOffset: 0  },
      { step: 2, channel: 'sms',   hoursOffset: 12 },
      { step: 3, channel: 'call',  hoursOffset: 24 },
      { step: 4, channel: 'sms',   hoursOffset: 36 },
      { step: 5, channel: 'call',  hoursOffset: 48 },
      { step: 6, channel: 'call',  hoursOffset: 60 },
      { step: 7, channel: 'sms',   hoursOffset: 72 },
    ],
  };

  const steps = SCHEDULES[tier];
  const now   = new Date();

  return steps.map(s => {
    const date = new Date(now.getTime() + s.hoursOffset * 60 * 60 * 1000);
    // Snap to 10:00 AM or 10:00 PM depending on even/odd step
    date.setMinutes(0, 0, 0);
    date.setHours(s.hoursOffset % 24 === 0 ? 10 : 22);
    return {
      step:         s.step,
      channel:      s.channel,
      scheduledFor: date.toISOString(),
      layer:        `tier_${tier}_step_${s.step}`,
    };
  });
}

module.exports = { buildSequence };
