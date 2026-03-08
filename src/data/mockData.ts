export const mockDebtors = [
  { id: 'D001', name: 'Marcus Allen', phone: '+15552104400', email: 'marcus@email.com', amount: 850, recovered: 0, tier: 1, status: 'Active', daysOverdue: 18, industry: 'Payday Loans', aiStage: 'SOFT_TOUCH', attempts: 3 },
  { id: 'D002', name: 'Priya Nair', phone: '+15553328812', email: 'priya@email.com', amount: 1200, recovered: 600, tier: 2, status: 'Negotiating', daysOverdue: 45, industry: 'Personal Loans', aiStage: 'NEGOTIATING', attempts: 7 },
  { id: 'D003', name: 'Derek Townsend', phone: '+15559015547', email: 'derek@email.com', amount: 550, recovered: 550, tier: 1, status: 'Paid', daysOverdue: 0, industry: 'Cash Advance', aiStage: 'RESOLVED', attempts: 2 },
  { id: 'D004', name: 'Sandra Kim', phone: '+15557843310', email: 'sandra@email.com', amount: 1450, recovered: 0, tier: 3, status: 'Escalated', daysOverdue: 92, industry: 'Payday Loans', aiStage: 'ESCALATED', attempts: 14 },
  { id: 'D005', name: 'James Okafor', phone: '+15556402298', email: 'james@email.com', amount: 975, recovered: 390, tier: 2, status: 'Active', daysOverdue: 38, industry: 'Personal Loans', aiStage: 'FLOOR_REACHED', attempts: 5 },
  { id: 'D006', name: 'Laura Chen', phone: '+15552197743', email: 'laura@email.com', amount: 620, recovered: 310, tier: 1, status: 'Negotiating', daysOverdue: 22, industry: 'Cash Advance', aiStage: 'NEGOTIATING', attempts: 4 },
  { id: 'D007', name: 'Antoine Dubois', phone: '+15558834421', email: 'antoine@email.com', amount: 1100, recovered: 550, tier: 2, status: 'Active', daysOverdue: 55, industry: 'Personal Loans', aiStage: 'NEGOTIATING', attempts: 9 },
  { id: 'D008', name: 'Rachel Gomez', phone: '+15551193820', email: 'rachel@email.com', amount: 780, recovered: 780, tier: 1, status: 'Paid', daysOverdue: 0, industry: 'BNPL', aiStage: 'RESOLVED', attempts: 3 },
  { id: 'D009', name: 'Michael Torres', phone: '+15554478901', email: 'michael@email.com', amount: 1500, recovered: 0, tier: 3, status: 'Escalated', daysOverdue: 120, industry: 'Payday Loans', aiStage: 'LEGAL_REVIEW', attempts: 21 },
  { id: 'D010', name: 'Aisha Tremblay', phone: '+15557720034', email: 'aisha@email.com', amount: 930, recovered: 465, tier: 2, status: 'Active', daysOverdue: 33, industry: 'Cash Advance', aiStage: 'SOFT_FIRM', attempts: 6 },
];

export const mockClients = [
  { id: 'C001', name: 'QuickCash Loans', industry: 'Payday Loans', accounts: 142, totalDebt: 128400, recovered: 52200, plan: 'Performance', status: 'Active' },
  { id: 'C002', name: 'EasyPay Lending', industry: 'Personal Loans', accounts: 89, totalDebt: 98500, recovered: 41800, plan: 'Performance', status: 'Active' },
  { id: 'C003', name: 'CashNow Advance', industry: 'Cash Advance', accounts: 67, totalDebt: 54200, recovered: 18900, plan: 'Performance', status: 'Active' },
  { id: 'C004', name: 'FlexiLoan Pro', industry: 'BNPL', accounts: 34, totalDebt: 32800, recovered: 14600, plan: 'Performance', status: 'Active' },
  { id: 'C005', name: 'NorthShore Finance', industry: 'Personal Loans', accounts: 201, totalDebt: 184500, recovered: 68200, plan: 'Performance', status: 'Onboarding' },
];

export const mockPromises = [
  { id: 'P001', debtorId: 'D002', debtor: 'Priya Nair', amount: 200, date: '2025-08-15', status: 'Upcoming', reschedules: 0, tier: 2 },
  { id: 'P002', debtorId: 'D001', debtor: 'Marcus Allen', amount: 150, date: '2025-08-10', status: 'Due Today', reschedules: 1, tier: 1 },
  { id: 'P003', debtorId: 'D007', debtor: 'Antoine Dubois', amount: 275, date: '2025-07-30', status: 'Broken', reschedules: 2, tier: 2 },
  { id: 'P004', debtorId: 'D006', debtor: 'Laura Chen', amount: 155, date: '2025-08-01', status: 'Paid', reschedules: 0, tier: 1 },
  { id: 'P005', debtorId: 'D010', debtor: 'Aisha Tremblay', amount: 230, date: '2025-08-20', status: 'Upcoming', reschedules: 0, tier: 2 },
  { id: 'P006', debtorId: 'D005', debtor: 'James Okafor', amount: 195, date: '2025-07-25', status: 'Broken', reschedules: 3, tier: 2 },
];

export const mockConversations = [
  {
    id: 'CV001', debtorId: 'D001', debtor: 'Marcus Allen', channel: 'SMS' as const, status: 'Active', aiStage: 'SOFT_TOUCH',
    messages: [
      { role: 'ai' as const, text: 'Hi Marcus, this is the Kollection system reaching out about your $850 balance with QuickCash Loans. We have flexible options available — can we find 2 minutes to sort this out?', time: '9:14 AM', stage: 'SOFT_TOUCH' },
      { role: 'debtor' as const, text: 'Who is this?', time: '9:22 AM' },
      { role: 'ai' as const, text: 'We manage recovery for QuickCash Loans. Your account #QC-4421 has been overdue since July. We genuinely want to help resolve this quickly and easily.', time: '9:23 AM', stage: 'SOFT_TOUCH' },
      { role: 'debtor' as const, text: "I can't pay the full amount right now.", time: '9:31 AM' },
      { role: 'ai' as const, text: "Completely understood — that's exactly why we offer installment plans. We can start as low as $85/month. Would a payment link help you get started today?", time: '9:31 AM', stage: 'NEGOTIATING' },
    ]
  },
  {
    id: 'CV002', debtorId: 'D002', debtor: 'Priya Nair', channel: 'Voice' as const, status: 'Negotiating', aiStage: 'NEGOTIATING',
    messages: [
      { role: 'ai' as const, text: '[VOICE CALL — Duration: 1m 42s] Transcript: AI introduced account, offered $200/month plan, debtor agreed to first payment on August 15th.', time: '9:32 AM', stage: 'NEGOTIATING' },
      { role: 'debtor' as const, text: "OK fine. I'll pay $200 on the 15th.", time: '9:33 AM' },
      { role: 'ai' as const, text: "Perfect! I've logged your promise to pay $200 on August 15th. I'll send a payment link 24 hours before. Is this the best number to reach you?", time: '9:33 AM', stage: 'COMMITMENT_SECURED' },
    ]
  },
  {
    id: 'CV003', debtorId: 'D005', debtor: 'James Okafor', channel: 'Email' as const, status: 'Active', aiStage: 'FLOOR_REACHED',
    messages: [
      { role: 'ai' as const, text: 'Dear James, We are reaching out regarding your outstanding balance of $975 with EasyPay Lending. We can offer a settlement of $780 if resolved within 14 days.', time: '2:15 PM', stage: 'NEGOTIATING' },
      { role: 'debtor' as const, text: 'That is still too much. Can you do $400?', time: '3:44 PM' },
      { role: 'ai' as const, text: 'We appreciate your willingness to resolve this. The minimum we can accept is $585. This represents a 40% reduction. Shall I generate a payment link?', time: '3:45 PM', stage: 'FLOOR_REACHED' },
    ]
  },
];

export const mockRecoveryChart = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  recovered: Math.floor(Math.random() * 1800 + 400),
  target: 1600,
}));

// 50/50 fee split model
export const mockMonthlyData = [
  { month: 'Mar', gross: 6200, kollection: 3100, client: 3100 },
  { month: 'Apr', gross: 7800, kollection: 3900, client: 3900 },
  { month: 'May', gross: 5400, kollection: 2700, client: 2700 },
  { month: 'Jun', gross: 9100, kollection: 4550, client: 4550 },
  { month: 'Jul', gross: 8420, kollection: 4210, client: 4210 },
  { month: 'Aug', gross: 11200, kollection: 5600, client: 5600 },
];

export const mockInstallments = [
  { id: 'INS001', debtor: 'Priya Nair', debtorId: 'D002', totalAmount: 1200, paidAmount: 600, planAmount: 200, frequency: 'Monthly', paymentsTotal: 6, paymentsMade: 3, status: 'Active', nextDue: '2025-08-15' },
  { id: 'INS002', debtor: 'James Okafor', debtorId: 'D005', totalAmount: 975, paidAmount: 390, planAmount: 195, frequency: 'Bi-weekly', paymentsTotal: 5, paymentsMade: 2, status: 'Active', nextDue: '2025-08-12' },
  { id: 'INS003', debtor: 'Antoine Dubois', debtorId: 'D007', totalAmount: 1100, paidAmount: 550, planAmount: 275, frequency: 'Monthly', paymentsTotal: 4, paymentsMade: 2, status: 'Behind', nextDue: '2025-07-30' },
  { id: 'INS004', debtor: 'Laura Chen', debtorId: 'D006', totalAmount: 620, paidAmount: 310, planAmount: 155, frequency: 'Monthly', paymentsTotal: 4, paymentsMade: 2, status: 'Active', nextDue: '2025-08-05' },
  { id: 'INS005', debtor: 'Aisha Tremblay', debtorId: 'D010', totalAmount: 930, paidAmount: 465, planAmount: 230, frequency: 'Monthly', paymentsTotal: 4, paymentsMade: 2, status: 'Active', nextDue: '2025-08-18' },
];

export const mockAiActivityFeed = [
  { id: 1, time: '10:42:18', channel: 'SMS', action: 'Sent Tier 1 soft touch to Marcus Allen — $850', status: 'success' },
  { id: 2, time: '10:41:55', channel: 'Voice', action: 'Completed call with Priya Nair — $200 promise secured', status: 'success' },
  { id: 3, time: '10:40:12', channel: 'Email', action: 'Floor offer sent to James Okafor — $585 min', status: 'pending' },
  { id: 4, time: '10:39:44', channel: 'SMS', action: 'Payment link generated for Laura Chen — $310', status: 'success' },
  { id: 5, time: '10:38:01', channel: 'System', action: 'Risk score updated: Sandra Kim → Tier 3', status: 'warning' },
  { id: 6, time: '10:36:30', channel: 'Voice', action: 'Call attempt failed — Antoine Dubois no answer', status: 'error' },
  { id: 7, time: '10:35:15', channel: 'SMS', action: 'Follow-up reminder sent to Aisha Tremblay — $930', status: 'success' },
  { id: 8, time: '10:33:42', channel: 'System', action: 'Escalation triggered: Michael Torres → Human Queue', status: 'warning' },
];

export const mockHeatmapData = Array.from({ length: 7 }, (_, day) =>
  Array.from({ length: 24 }, (_, hour) => ({
    day,
    hour,
    value: Math.random() * (hour >= 8 && hour <= 20 ? 100 : 20),
  }))
).flat();

export const mockOnboardingApplications = [
  { id: 'APP001', company: 'RapidLoans Inc.', contact: 'Sarah Johnson', email: 'sarah@rapidloans.com', type: 'Payday Loan Company', submitted: '2025-08-01', status: 'Pending', avgLoan: '$500–$1,000', monthlyAccounts: '50–100' },
  { id: 'APP002', company: 'EZ Advance Corp', contact: 'Mike Chen', email: 'mike@ezadvance.com', type: 'Cash Advance', submitted: '2025-07-28', status: 'Approved', avgLoan: '$300–$500', monthlyAccounts: '100–500' },
  { id: 'APP003', company: 'TrustBridge Lending', contact: 'Amy Williams', email: 'amy@trustbridge.com', type: 'Personal Loan Provider', submitted: '2025-07-25', status: 'Pending', avgLoan: '$1,000–$1,500', monthlyAccounts: '10–50' },
  { id: 'APP004', company: 'PayFlex BNPL', contact: 'Jordan Lee', email: 'jordan@payflex.com', type: 'BNPL', submitted: '2025-07-20', status: 'Rejected', avgLoan: '$100–$300', monthlyAccounts: '500+' },
];
