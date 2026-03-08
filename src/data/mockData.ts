export const mockDebtors = [
  { id: 'D001', name: 'Marcus Allen', phone: '+15552104400', email: 'marcus@email.com', address: '123 Main St, Montreal QC', balance: 850, recovered: 0, tier: 1, status: 'Active', daysOverdue: 18, aiStage: 'SOFT_TOUCH', attempts: 3, lastAction: 'SMS sent — soft touch', lastActionDate: '2025-08-05', company: 'QuickCash Loans Inc.' },
  { id: 'D002', name: 'Priya Nair', phone: '+15553328812', email: 'priya@email.com', address: '456 Oak Ave, Toronto ON', balance: 1200, recovered: 600, tier: 2, status: 'Negotiating', daysOverdue: 45, aiStage: 'NEGOTIATING', attempts: 7, lastAction: 'Promise secured — $200', lastActionDate: '2025-08-04', company: 'QuickCash Loans Inc.' },
  { id: 'D003', name: 'Derek Townsend', phone: '+15559015547', email: 'derek@email.com', address: '789 Pine Rd, Calgary AB', balance: 550, recovered: 550, tier: 1, status: 'Paid', daysOverdue: 0, aiStage: 'RESOLVED', attempts: 2, lastAction: 'Full payment received', lastActionDate: '2025-07-28', company: 'QuickCash Loans Inc.' },
  { id: 'D004', name: 'Sandra Kim', phone: '+15557843310', email: 'sandra@email.com', address: '321 Elm St, Ottawa ON', balance: 1450, recovered: 0, tier: 3, status: 'Manual', daysOverdue: 92, aiStage: 'ESCALATED', attempts: 14, lastAction: 'Escalated to human queue', lastActionDate: '2025-08-03', company: 'QuickCash Loans Inc.' },
  { id: 'D005', name: 'James Okafor', phone: '+15556402298', email: 'james@email.com', address: '654 Maple Dr, Vancouver BC', balance: 975, recovered: 390, tier: 2, status: 'Active', daysOverdue: 38, aiStage: 'FLOOR_REACHED', attempts: 5, lastAction: 'Floor offer emailed — $585', lastActionDate: '2025-08-05', company: 'QuickCash Loans Inc.' },
  { id: 'D006', name: 'Laura Chen', phone: '+15552197743', email: 'laura@email.com', address: '22 King St W, Toronto ON', balance: 620, recovered: 310, tier: 1, status: 'Negotiating', daysOverdue: 22, aiStage: 'NEGOTIATING', attempts: 4, lastAction: 'Payment link opened', lastActionDate: '2025-08-04', company: 'QuickCash Loans Inc.' },
  { id: 'D007', name: 'Antoine Dubois', phone: '+15558834421', email: 'antoine@email.com', address: '88 Rue St-Denis, Montreal QC', balance: 1100, recovered: 550, tier: 2, status: 'Active', daysOverdue: 55, aiStage: 'NEGOTIATING', attempts: 9, lastAction: 'Call — no answer', lastActionDate: '2025-08-03', company: 'QuickCash Loans Inc.' },
  { id: 'D008', name: 'Rachel Gomez', phone: '+15551193820', email: 'rachel@email.com', address: '45 Bloor St E, Toronto ON', balance: 780, recovered: 780, tier: 1, status: 'Paid', daysOverdue: 0, aiStage: 'RESOLVED', attempts: 3, lastAction: 'Full payment received', lastActionDate: '2025-07-20', company: 'QuickCash Loans Inc.' },
  { id: 'D009', name: 'Michael Torres', phone: '+15554478901', email: 'michael@email.com', address: '120 Portage Ave, Winnipeg MB', balance: 1500, recovered: 0, tier: 3, status: 'Escalated', daysOverdue: 120, aiStage: 'LEGAL_REVIEW', attempts: 21, lastAction: 'Legal review initiated', lastActionDate: '2025-08-01', company: 'QuickCash Loans Inc.' },
  { id: 'D010', name: 'Aisha Tremblay', phone: '+15557720034', email: 'aisha@email.com', address: '300 Sparks St, Ottawa ON', balance: 930, recovered: 465, tier: 2, status: 'Active', daysOverdue: 33, aiStage: 'SOFT_FIRM', attempts: 6, lastAction: 'Follow-up SMS sent', lastActionDate: '2025-08-05', company: 'QuickCash Loans Inc.' },
];

export const mockConversations = [
  {
    id: 'CV001', debtorId: 'D001', debtor: 'Marcus Allen', channel: 'SMS', status: 'Active',
    stage: 'NEGOTIATING', lastActivity: '10 min ago', company: 'QuickCash Loans Inc.',
    messages: [
      { role: 'ai' as const, text: "Hi Marcus, this is Alex from QuickCash Loans. Your balance of $850 is past due. We'd like to help — reply to arrange a plan.", time: '9:14 AM', stage: 'SOFT_TOUCH' },
      { role: 'debtor' as const, text: "Things have been tight. I know I owe it.", time: '9:28 AM' },
      { role: 'ai' as const, text: "We completely understand. We can set up a plan at $85/month. Would that work?", time: '9:28 AM', stage: 'NEGOTIATING' },
      { role: 'debtor' as const, text: "Maybe. Can I think about it?", time: '9:35 AM' },
      { role: 'ai' as const, text: "Of course. I'll send you the payment link — no pressure, review when ready.", time: '9:35 AM', stage: 'NEGOTIATING' },
    ],
  },
  {
    id: 'CV002', debtorId: 'D002', debtor: 'Priya Nair', channel: 'Voice', status: 'Committed',
    stage: 'COMMITTED', lastActivity: '2 hrs ago', company: 'QuickCash Loans Inc.',
    messages: [
      {
        role: 'ai' as const, text: '📞 Voice call — 2m 23s', time: '7:32 AM', stage: 'SOFT_TOUCH', isCall: true,
        transcript: [
          { speaker: 'AI', text: 'Hello, may I speak with Priya?' },
          { speaker: 'Debtor', text: 'Speaking.' },
          { speaker: 'AI', text: "Hi Priya, this is Alex from QuickCash Loans regarding your balance of $1,200. We'd like to find a solution. Are you open to a plan?" },
          { speaker: 'Debtor', text: 'Yes. What are my options?' },
          { speaker: 'AI', text: "We can do $120/month for 10 months. First payment in 7 days. Does that work?" },
          { speaker: 'Debtor', text: 'Yes, send me the link.' },
        ],
      },
      { role: 'ai' as const, text: "Payment plan confirmed: $120/month × 10 months. Link sent to your phone.", time: '7:34 AM', stage: 'COMMITTED' },
    ],
  },
  {
    id: 'CV003', debtorId: 'D004', debtor: 'Sandra Kim', channel: 'SMS', status: 'Manual',
    stage: 'ESCALATED', lastActivity: '1 day ago', company: 'QuickCash Loans Inc.',
    messages: [
      { role: 'ai' as const, text: "Hi Sandra, final notice re: your $1,450 balance. Settlement available — reply to discuss.", time: 'Mon 10:00 AM', stage: 'FINAL' },
      { role: 'debtor' as const, text: "I want to speak to a real person.", time: 'Mon 10:45 AM' },
      { role: 'ai' as const, text: "Absolutely. Connecting you with a team member. You'll hear from us within 4 business hours.", time: 'Mon 10:45 AM', stage: 'ESCALATED' },
      { role: 'system' as const, text: '── Manual takeover requested · Kollection team notified ──', time: 'Mon 10:46 AM' },
    ],
  },
  {
    id: 'CV004', debtorId: 'D005', debtor: 'James Okafor', channel: 'Email', status: 'Active',
    stage: 'FLOOR_REACHED', lastActivity: '3 hrs ago', company: 'QuickCash Loans Inc.',
    messages: [
      { role: 'ai' as const, text: "Dear James, we're reaching out regarding your outstanding balance of $975 with QuickCash Loans. We have a settlement offer that could significantly reduce your amount owed.", time: '6:30 AM', stage: 'NEGOTIATING' },
      { role: 'debtor' as const, text: "What's the offer?", time: '8:15 AM' },
      { role: 'ai' as const, text: "We can settle your full balance for $585 — a 40% reduction. This is a one-time offer valid for 7 days. Would you like a payment link?", time: '8:15 AM', stage: 'FLOOR_REACHED' },
    ],
  },
  {
    id: 'CV005', debtorId: 'D006', debtor: 'Laura Chen', channel: 'SMS', status: 'Active',
    stage: 'NEGOTIATING', lastActivity: '5 hrs ago', company: 'QuickCash Loans Inc.',
    messages: [
      { role: 'ai' as const, text: "Hi Laura, this is QuickCash Loans. Your account has a balance of $620. We'd like to set up a comfortable payment plan. Would $155/month work?", time: '11:00 AM', stage: 'SOFT_TOUCH' },
      { role: 'debtor' as const, text: "That's a bit high. Can we do less?", time: '11:30 AM' },
      { role: 'ai' as const, text: "We can offer $105/month over 6 months. Would that be more manageable?", time: '11:30 AM', stage: 'NEGOTIATING' },
    ],
  },
];

export const mockClients = [
  {
    id: 'C001', name: 'QuickCash Loans Inc.', industry: 'Payday Loans',
    setupFee: 5000, recoveryPct: 50, operationsPct: 8,
    status: 'Active', accounts: 142,
    infrastructure: { twilio: true, stripe: true, vapi: true },
    twilioPhone: '+18005550142', vapiAgent: 'Alex',
    monthlyRecovered: 8420, totalDebt: 128400, recovered: 52200,
  },
  {
    id: 'C002', name: 'Apex Lending Group', industry: 'Personal Loans',
    setupFee: 3000, recoveryPct: 40, operationsPct: 6,
    status: 'Active', accounts: 89,
    infrastructure: { twilio: true, stripe: true, vapi: true },
    twilioPhone: '+18005550189', vapiAgent: 'Sarah',
    monthlyRecovered: 12100, totalDebt: 98500, recovered: 41800,
  },
  {
    id: 'C003', name: 'ClearPath Finance', industry: 'Auto Loans',
    setupFee: 5000, recoveryPct: 50, operationsPct: 8,
    status: 'Onboarding', accounts: 0,
    infrastructure: { twilio: true, stripe: false, vapi: false },
    twilioPhone: '+18005550134', vapiAgent: null,
    monthlyRecovered: 0, totalDebt: 54200, recovered: 18900,
  },
  {
    id: 'C004', name: 'NorthShore Credit', industry: 'BNPL',
    setupFee: 4000, recoveryPct: 45, operationsPct: 7,
    status: 'Active', accounts: 201,
    infrastructure: { twilio: true, stripe: true, vapi: true },
    twilioPhone: '+18005550201', vapiAgent: 'Alex',
    monthlyRecovered: 14200, totalDebt: 184500, recovered: 68200,
  },
];

export const mockFeeHistory = [
  { date: '2025-07-01', company: 'Apex Lending Group', field: 'recoveryPct', oldValue: 50, newValue: 40, reason: 'New client promotional rate', changedBy: 'admin@kollection.ca' },
  { date: '2025-05-15', company: 'Apex Lending Group', field: 'setupFee', oldValue: 5000, newValue: 3000, reason: 'Referral partner discount', changedBy: 'admin@kollection.ca' },
  { date: '2025-06-01', company: 'NorthShore Credit', field: 'operationsPct', oldValue: 8, newValue: 7, reason: 'High volume client discount', changedBy: 'admin@kollection.ca' },
];

export const mockOperationsCosts = {
  period: 'Jul 2025',
  breakdown: [
    { type: 'SMS Sent', count: 847, unitCost: 0.0079, total: 6.69 },
    { type: 'Voice Calls', count: 312, unitCost: 0.052, total: 16.22 },
    { type: 'Voicemails', count: 189, unitCost: 0.013, total: 2.46 },
    { type: 'Emails Sent', count: 1024, unitCost: 0.001, total: 1.02 },
  ],
  actualCost: 26.39,
  opsFeeCharged: 673.60,
  surplus: 647.21,
  grossRecovered: 8420,
  opsFeePct: 8,
  afterOps: 7746.40,
  kollectionShare: 3873.20,
  clientShare: 3873.20,
};

export const mockActivityLog = [
  { id: 1, timestamp: '2025-08-05 10:42', debtor: 'Marcus Allen', type: 'SMS Sent', channel: 'SMS', outcome: 'Delivered', aiStage: 'SOFT_TOUCH' },
  { id: 2, timestamp: '2025-08-05 10:38', debtor: 'Aisha Tremblay', type: 'SMS Sent', channel: 'SMS', outcome: 'Delivered', aiStage: 'SOFT_FIRM' },
  { id: 3, timestamp: '2025-08-04 15:33', debtor: 'Priya Nair', type: 'Call Made', channel: 'Voice', outcome: 'Promise logged — $200', aiStage: 'NEGOTIATING' },
  { id: 4, timestamp: '2025-08-04 14:20', debtor: 'Laura Chen', type: 'Payment Received', channel: 'System', outcome: '$155 paid', aiStage: 'NEGOTIATING' },
  { id: 5, timestamp: '2025-08-03 11:15', debtor: 'Antoine Dubois', type: 'Call Made', channel: 'Voice', outcome: 'No answer', aiStage: 'NEGOTIATING' },
  { id: 6, timestamp: '2025-08-03 10:50', debtor: 'Sandra Kim', type: 'Escalated', channel: 'System', outcome: 'Moved to human queue', aiStage: 'ESCALATED' },
  { id: 7, timestamp: '2025-08-02 09:30', debtor: 'James Okafor', type: 'Email Sent', channel: 'Email', outcome: 'Floor offer — $585', aiStage: 'FLOOR_REACHED' },
  { id: 8, timestamp: '2025-08-01 16:00', debtor: 'Michael Torres', type: 'Escalated', channel: 'System', outcome: 'Legal review', aiStage: 'LEGAL_REVIEW' },
  { id: 9, timestamp: '2025-07-30 13:22', debtor: 'Antoine Dubois', type: 'Promise Broken', channel: 'System', outcome: 'Missed $275 payment', aiStage: 'NEGOTIATING' },
  { id: 10, timestamp: '2025-07-28 11:10', debtor: 'Derek Townsend', type: 'Payment Received', channel: 'System', outcome: 'Full payment — $550', aiStage: 'RESOLVED' },
];

export const mockRecoveryChart = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  recovered: Math.floor(Math.random() * 1800 + 400),
}));

export const mockMonthlyData = [
  { month: 'Mar', gross: 6200, opsFee: 496, kollection: 2852, client: 2852 },
  { month: 'Apr', gross: 7800, opsFee: 624, kollection: 3588, client: 3588 },
  { month: 'May', gross: 5400, opsFee: 432, kollection: 2484, client: 2484 },
  { month: 'Jun', gross: 9100, opsFee: 728, kollection: 4186, client: 4186 },
  { month: 'Jul', gross: 8420, opsFee: 673.60, kollection: 3873.20, client: 3873.20 },
  { month: 'Aug', gross: 11200, opsFee: 896, kollection: 5152, client: 5152 },
];

export const mockBillingData = {
  setupFeePaid: { amount: 5000, date: 'Jan 15, 2025' },
  currentMonth: {
    recovered: 8420,
    opsFee: 673.60,
    opsFeePct: 8,
    afterOps: 7746.40,
    kollection: 3873.20,
    client: 3873.20,
    payoutDate: 'Sep 1, 2025',
    status: 'SCHEDULED',
  },
  history: [
    { month: 'Aug 2025', recovered: 8420, opsFee: 673.60, kollection: 3873.20, client: 3873.20, status: 'Scheduled', transferId: null },
    { month: 'Jul 2025', recovered: 7800, opsFee: 624, kollection: 3588, client: 3588, status: 'Paid', transferId: 'tr_3Pxxx1' },
    { month: 'Jun 2025', recovered: 5400, opsFee: 432, kollection: 2484, client: 2484, status: 'Paid', transferId: 'tr_3Pxxx2' },
    { month: 'May 2025', recovered: 9100, opsFee: 728, kollection: 4186, client: 4186, status: 'Paid', transferId: 'tr_3Pxxx3' },
    { month: 'Apr 2025', recovered: 6200, opsFee: 496, kollection: 2852, client: 2852, status: 'Paid', transferId: 'tr_3Pxxx4' },
  ],
};

export const mockInstallments = [
  { id: 'INS001', debtor: 'Priya Nair', debtorId: 'D002', totalAmount: 1200, paidAmount: 600, planAmount: 200, frequency: 'Monthly', paymentsTotal: 6, paymentsMade: 3, status: 'Active', nextDue: '2025-08-15' },
  { id: 'INS002', debtor: 'James Okafor', debtorId: 'D005', totalAmount: 975, paidAmount: 390, planAmount: 195, frequency: 'Bi-weekly', paymentsTotal: 5, paymentsMade: 2, status: 'Active', nextDue: '2025-08-12' },
  { id: 'INS003', debtor: 'Antoine Dubois', debtorId: 'D007', totalAmount: 1100, paidAmount: 550, planAmount: 275, frequency: 'Monthly', paymentsTotal: 4, paymentsMade: 2, status: 'Behind', nextDue: '2025-07-30' },
  { id: 'INS004', debtor: 'Laura Chen', debtorId: 'D006', totalAmount: 620, paidAmount: 310, planAmount: 155, frequency: 'Monthly', paymentsTotal: 4, paymentsMade: 2, status: 'Active', nextDue: '2025-08-05' },
  { id: 'INS005', debtor: 'Aisha Tremblay', debtorId: 'D010', totalAmount: 930, paidAmount: 465, planAmount: 230, frequency: 'Monthly', paymentsTotal: 4, paymentsMade: 2, status: 'Active', nextDue: '2025-08-18' },
];

export const mockOnboardingApplications = [
  { id: 'APP001', company: 'RapidLoans Inc.', contact: 'Sarah Johnson', email: 'sarah@rapidloans.com', type: 'Payday Loan Company', submitted: '2025-08-01', status: 'Pending', avgLoan: '$500–$1,000', monthlyAccounts: '50–100' },
  { id: 'APP002', company: 'EZ Advance Corp', contact: 'Mike Chen', email: 'mike@ezadvance.com', type: 'Cash Advance', submitted: '2025-07-28', status: 'Approved', avgLoan: '$300–$500', monthlyAccounts: '100–500' },
  { id: 'APP003', company: 'TrustBridge Lending', contact: 'Amy Williams', email: 'amy@trustbridge.com', type: 'Personal Loan Provider', submitted: '2025-07-25', status: 'Pending', avgLoan: '$1,000–$1,500', monthlyAccounts: '10–50' },
  { id: 'APP004', company: 'PayFlex BNPL', contact: 'Jordan Lee', email: 'jordan@payflex.com', type: 'BNPL', submitted: '2025-07-20', status: 'Rejected', avgLoan: '$100–$300', monthlyAccounts: '500+' },
];
