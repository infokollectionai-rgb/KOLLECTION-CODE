export const mockDebtors = [
  { id: 'D001', name: 'Marcus Allen', phone: '+15552104400', email: 'marcus@email.com', amount: 4200, recovered: 0, tier: 1, status: 'Active', daysOverdue: 18, industry: 'Medical', aiStage: 'SOFT_TOUCH', attempts: 3 },
  { id: 'D002', name: 'Priya Nair', phone: '+15553328812', email: 'priya@email.com', amount: 11800, recovered: 3500, tier: 2, status: 'Negotiating', daysOverdue: 55, industry: 'Financial', aiStage: 'NEGOTIATING', attempts: 7 },
  { id: 'D003', name: 'Derek Townsend', phone: '+15559015547', email: 'derek@email.com', amount: 890, recovered: 890, tier: 1, status: 'Paid', daysOverdue: 0, industry: 'Retail', aiStage: 'RESOLVED', attempts: 2 },
  { id: 'D004', name: 'Sandra Kim', phone: '+15557843310', email: 'sandra@email.com', amount: 23400, recovered: 0, tier: 3, status: 'Escalated', daysOverdue: 122, industry: 'Utilities', aiStage: 'ESCALATED', attempts: 14 },
  { id: 'D005', name: 'James Okafor', phone: '+15556402298', email: 'james@email.com', amount: 6750, recovered: 1200, tier: 2, status: 'Active', daysOverdue: 44, industry: 'Medical', aiStage: 'FLOOR_REACHED', attempts: 5 },
  { id: 'D006', name: 'Laura Chen', phone: '+15552197743', email: 'laura@email.com', amount: 3100, recovered: 500, tier: 1, status: 'Negotiating', daysOverdue: 22, industry: 'Financial', aiStage: 'NEGOTIATING', attempts: 4 },
  { id: 'D007', name: 'Antoine Dubois', phone: '+15558834421', email: 'antoine@email.com', amount: 15600, recovered: 4800, tier: 2, status: 'Active', daysOverdue: 68, industry: 'Medical', aiStage: 'NEGOTIATING', attempts: 9 },
  { id: 'D008', name: 'Rachel Gomez', phone: '+15551193820', email: 'rachel@email.com', amount: 2200, recovered: 2200, tier: 1, status: 'Paid', daysOverdue: 0, industry: 'Retail', aiStage: 'RESOLVED', attempts: 3 },
  { id: 'D009', name: 'Michael Torres', phone: '+15554478901', email: 'michael@email.com', amount: 31000, recovered: 0, tier: 3, status: 'Escalated', daysOverdue: 180, industry: 'Financial', aiStage: 'LEGAL_REVIEW', attempts: 21 },
  { id: 'D010', name: 'Aisha Tremblay', phone: '+15557720034', email: 'aisha@email.com', amount: 5400, recovered: 1800, tier: 2, status: 'Active', daysOverdue: 38, industry: 'Utilities', aiStage: 'SOFT_FIRM', attempts: 6 },
];

export const mockClients = [
  { id: 'C001', name: 'MediCredit Corp', industry: 'Medical', accounts: 142, totalDebt: 2840000, recovered: 1820000, plan: 'Performance', status: 'Active' },
  { id: 'C002', name: 'Apex Lending Group', industry: 'Financial', accounts: 89, totalDebt: 5600000, recovered: 2900000, plan: 'Hybrid', status: 'Active' },
  { id: 'C003', name: 'ClearPath Utilities', industry: 'Utilities', accounts: 67, totalDebt: 890000, recovered: 340000, plan: 'Performance', status: 'Active' },
  { id: 'C004', name: 'RetailDebt Pro', industry: 'Retail', accounts: 34, totalDebt: 220000, recovered: 185000, plan: 'Hybrid', status: 'Active' },
  { id: 'C005', name: 'NorthShore Finance', industry: 'Financial', accounts: 201, totalDebt: 8100000, recovered: 3100000, plan: 'Enterprise', status: 'Onboarding' },
];

export const mockPromises = [
  { id: 'P001', debtorId: 'D002', debtor: 'Priya Nair', amount: 500, date: '2025-08-15', status: 'Upcoming', reschedules: 0, tier: 2 },
  { id: 'P002', debtorId: 'D001', debtor: 'Marcus Allen', amount: 200, date: '2025-08-10', status: 'Due Today', reschedules: 1, tier: 1 },
  { id: 'P003', debtorId: 'D007', debtor: 'Antoine Dubois', amount: 1000, date: '2025-07-30', status: 'Broken', reschedules: 2, tier: 2 },
  { id: 'P004', debtorId: 'D006', debtor: 'Laura Chen', amount: 500, date: '2025-08-01', status: 'Paid', reschedules: 0, tier: 1 },
  { id: 'P005', debtorId: 'D010', debtor: 'Aisha Tremblay', amount: 750, date: '2025-08-20', status: 'Upcoming', reschedules: 0, tier: 2 },
  { id: 'P006', debtorId: 'D005', debtor: 'James Okafor', amount: 400, date: '2025-07-25', status: 'Broken', reschedules: 3, tier: 2 },
];

export const mockConversations = [
  {
    id: 'CV001', debtorId: 'D001', debtor: 'Marcus Allen', channel: 'SMS' as const, status: 'Active', aiStage: 'SOFT_TOUCH',
    messages: [
      { role: 'ai' as const, text: 'Hi Marcus, this is the Kollection system reaching out about your $4,200 balance. We have flexible options available — can we find 2 minutes to sort this out?', time: '9:14 AM', stage: 'SOFT_TOUCH' },
      { role: 'debtor' as const, text: 'Who is this?', time: '9:22 AM' },
      { role: 'ai' as const, text: 'We manage recovery for MediCredit. Your account #MC-4421 has been with us since July 3rd. We genuinely want to help resolve this quickly and easily.', time: '9:23 AM', stage: 'SOFT_TOUCH' },
      { role: 'debtor' as const, text: "I can't pay the full amount right now.", time: '9:31 AM' },
      { role: 'ai' as const, text: "Completely understood — that's exactly why we offer installment plans. We can start as low as $140/month. Would a payment link help you get started today?", time: '9:31 AM', stage: 'NEGOTIATING' },
    ]
  },
  {
    id: 'CV002', debtorId: 'D002', debtor: 'Priya Nair', channel: 'Voice' as const, status: 'Negotiating', aiStage: 'NEGOTIATING',
    messages: [
      { role: 'ai' as const, text: '[VOICE CALL — Duration: 1m 42s] Transcript: AI introduced account, offered $500/month plan, debtor agreed to first payment on August 15th.', time: '9:32 AM', stage: 'NEGOTIATING' },
      { role: 'debtor' as const, text: "OK fine. I'll pay $500 on the 15th.", time: '9:33 AM' },
      { role: 'ai' as const, text: "Perfect! I've logged your promise to pay $500 on August 15th. I'll send a payment link 24 hours before. Is this the best number to reach you?", time: '9:33 AM', stage: 'COMMITMENT_SECURED' },
    ]
  },
  {
    id: 'CV003', debtorId: 'D005', debtor: 'James Okafor', channel: 'Email' as const, status: 'Active', aiStage: 'FLOOR_REACHED',
    messages: [
      { role: 'ai' as const, text: 'Dear James, We are reaching out regarding your outstanding balance of $6,750. We can offer a settlement of $5,400 if resolved within 14 days.', time: '2:15 PM', stage: 'NEGOTIATING' },
      { role: 'debtor' as const, text: 'That is still too much. Can you do $3,000?', time: '3:44 PM' },
      { role: 'ai' as const, text: 'We appreciate your willingness to resolve this. The minimum we can accept is $4,050. This represents a 40% reduction. Shall I generate a payment link?', time: '3:45 PM', stage: 'FLOOR_REACHED' },
    ]
  },
];

export const mockRecoveryChart = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  recovered: Math.floor(Math.random() * 8000 + 2000),
  target: 8000,
}));

export const mockMonthlyData = [
  { month: 'Jan', gross: 42000, net: 33600, fee: 8400 },
  { month: 'Feb', gross: 38000, net: 30400, fee: 7600 },
  { month: 'Mar', gross: 51000, net: 40800, fee: 10200 },
  { month: 'Apr', gross: 47000, net: 37600, fee: 9400 },
  { month: 'May', gross: 63000, net: 50400, fee: 12600 },
  { month: 'Jun', gross: 58000, net: 46400, fee: 11600 },
];

export const mockInstallments = [
  { id: 'INS001', debtor: 'Priya Nair', debtorId: 'D002', totalAmount: 11800, paidAmount: 3500, planAmount: 500, frequency: 'Monthly', paymentsTotal: 24, paymentsMade: 7, status: 'Active', nextDue: '2025-08-15' },
  { id: 'INS002', debtor: 'James Okafor', debtorId: 'D005', totalAmount: 6750, paidAmount: 1200, planAmount: 300, frequency: 'Bi-weekly', paymentsTotal: 18, paymentsMade: 4, status: 'Active', nextDue: '2025-08-12' },
  { id: 'INS003', debtor: 'Antoine Dubois', debtorId: 'D007', totalAmount: 15600, paidAmount: 4800, planAmount: 800, frequency: 'Monthly', paymentsTotal: 20, paymentsMade: 6, status: 'Behind', nextDue: '2025-07-30' },
  { id: 'INS004', debtor: 'Laura Chen', debtorId: 'D006', totalAmount: 3100, paidAmount: 500, planAmount: 250, frequency: 'Monthly', paymentsTotal: 12, paymentsMade: 2, status: 'Active', nextDue: '2025-08-05' },
  { id: 'INS005', debtor: 'Aisha Tremblay', debtorId: 'D010', totalAmount: 5400, paidAmount: 1800, planAmount: 400, frequency: 'Monthly', paymentsTotal: 14, paymentsMade: 5, status: 'Active', nextDue: '2025-08-18' },
];

export const mockAiActivityFeed = [
  { id: 1, time: '10:42:18', channel: 'SMS', action: 'Sent Tier 1 soft touch to Marcus Allen', status: 'success' },
  { id: 2, time: '10:41:55', channel: 'Voice', action: 'Completed call with Priya Nair — promise secured', status: 'success' },
  { id: 3, time: '10:40:12', channel: 'Email', action: 'Floor offer sent to James Okafor', status: 'pending' },
  { id: 4, time: '10:39:44', channel: 'SMS', action: 'Payment link generated for Laura Chen', status: 'success' },
  { id: 5, time: '10:38:01', channel: 'System', action: 'Risk score updated: Sandra Kim → Tier 3', status: 'warning' },
  { id: 6, time: '10:36:30', channel: 'Voice', action: 'Call attempt failed — Antoine Dubois no answer', status: 'error' },
  { id: 7, time: '10:35:15', channel: 'SMS', action: 'Follow-up reminder sent to Aisha Tremblay', status: 'success' },
  { id: 8, time: '10:33:42', channel: 'System', action: 'Escalation triggered: Michael Torres → Human Queue', status: 'warning' },
];

export const mockHeatmapData = Array.from({ length: 7 }, (_, day) =>
  Array.from({ length: 24 }, (_, hour) => ({
    day,
    hour,
    value: Math.random() * (hour >= 8 && hour <= 20 ? 100 : 20),
  }))
).flat();
