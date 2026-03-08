export const DEMO_USERS = [
  {
    email: 'admin@kollection.ca',
    password: 'Admin2025!',
    role: 'admin' as const,
    name: 'Admin — Kollection',
    company: 'Kollection Inc.',
  },
  {
    email: 'demo@quickcashloans.ca',
    password: 'Demo2025!',
    role: 'user' as const,
    name: 'Marc Tremblay',
    company: 'QuickCash Loans Inc.',
    setupFeePaid: 5000,
    recoveryFeePct: 50,
    operationsFeePct: 8,
    twilioConnected: true,
    stripeConnected: true,
    vapiConnected: true,
    payoutSchedule: 'monthly',
    payoutDay: 1,
  },
];
