/**
 * buildSequence(debtor)
 *
 * Returns an array of scheduled contact objects for a debtor based on their tier.
 * Each object: { step, channel, scheduledAt (ISO string) }
 *
 * Tier 1 (0–30 days overdue)  — gentle cadence, favour email/SMS
 * Tier 2 (31–60 days)         — accelerated, add calls
 * Tier 3 (61–90 days)         — urgent, lead with calls
 * Tier 4 (90+ days)           — final stage, max urgency
 */
function buildSequence(debtor) {
  const tier = Math.min(Math.max(parseInt(debtor.tier ?? 1, 10), 1), 4);

  // Schedules: array of { step, channel, days (offset from today) }
  const SCHEDULES = {
    1: [
      { step: 1, channel: 'sms',   days: 0  },
      { step: 2, channel: 'email', days: 2  },
      { step: 3, channel: 'sms',   days: 5  },
      { step: 4, channel: 'call',  days: 8  },
      { step: 5, channel: 'email', days: 12 },
      { step: 6, channel: 'sms',   days: 16 },
      { step: 7, channel: 'call',  days: 21 },
    ],
    2: [
      { step: 1, channel: 'sms',   days: 0  },
      { step: 2, channel: 'call',  days: 1  },
      { step: 3, channel: 'email', days: 3  },
      { step: 4, channel: 'sms',   days: 6  },
      { step: 5, channel: 'call',  days: 9  },
      { step: 6, channel: 'sms',   days: 13 },
      { step: 7, channel: 'call',  days: 17 },
    ],
    3: [
      { step: 1, channel: 'call',  days: 0  },
      { step: 2, channel: 'sms',   days: 1  },
      { step: 3, channel: 'email', days: 2  },
      { step: 4, channel: 'call',  days: 4  },
      { step: 5, channel: 'sms',   days: 7  },
      { step: 6, channel: 'call',  days: 10 },
      { step: 7, channel: 'email', days: 14 },
    ],
    4: [
      { step: 1, channel: 'call',  days: 0  },
      { step: 2, channel: 'sms',   days: 1  },
      { step: 3, channel: 'call',  days: 3  },
      { step: 4, channel: 'email', days: 5  },
      { step: 5, channel: 'call',  days: 7  },
      { step: 6, channel: 'sms',   days: 10 },
      { step: 7, channel: 'call',  days: 14 },
    ],
  };

  const steps = SCHEDULES[tier];

  return steps.map(s => {
    const date = new Date();
    date.setDate(date.getDate() + s.days);
    date.setHours(10, 0, 0, 0); // Schedule all contacts for 10 am
    return {
      step:        s.step,
      channel:     s.channel,
      scheduledAt: date.toISOString(),
    };
  });
}

module.exports = { buildSequence };
