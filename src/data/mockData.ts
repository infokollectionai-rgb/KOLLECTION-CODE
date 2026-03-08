export const mockDebtors = [
  { id: 'D001', name: 'Marcus Allen', phone: '+15552104400', email: 'marcus@email.com', amount: 850, recovered: 0, tier: 1, status: 'Active', daysOverdue: 18, aiStage: 'SOFT_TOUCH', attempts: 3, lastAction: 'SMS sent — soft touch', lastActionDate: '2025-08-05' },
  { id: 'D002', name: 'Priya Nair', phone: '+15553328812', email: 'priya@email.com', amount: 1200, recovered: 600, tier: 2, status: 'Negotiating', daysOverdue: 45, aiStage: 'NEGOTIATING', attempts: 7, lastAction: 'Promise secured — $200', lastActionDate: '2025-08-04' },
  { id: 'D003', name: 'Derek Townsend', phone: '+15559015547', email: 'derek@email.com', amount: 550, recovered: 550, tier: 1, status: 'Resolved', daysOverdue: 0, aiStage: 'RESOLVED', attempts: 2, lastAction: 'Full payment received', lastActionDate: '2025-07-28' },
  { id: 'D004', name: 'Sandra Kim', phone: '+15557843310', email: 'sandra@email.com', amount: 1450, recovered: 0, tier: 3, status: 'Escalated', daysOverdue: 92, aiStage: 'ESCALATED', attempts: 14, lastAction: 'Escalated to human queue', lastActionDate: '2025-08-03' },
  { id: 'D005', name: 'James Okafor', phone: '+15556402298', email: 'james@email.com', amount: 975, recovered: 390, tier: 2, status: 'Active', daysOverdue: 38, aiStage: 'FLOOR_REACHED', attempts: 5, lastAction: 'Floor offer emailed — $585', lastActionDate: '2025-08-05' },
  { id: 'D006', name: 'Laura Chen', phone: '+15552197743', email: 'laura@email.com', amount: 620, recovered: 310, tier: 1, status: 'Negotiating', daysOverdue: 22, aiStage: 'NEGOTIATING', attempts: 4, lastAction: 'Payment link opened', lastActionDate: '2025-08-04' },
  { id: 'D007', name: 'Antoine Dubois', phone: '+15558834421', email: 'antoine@email.com', amount: 1100, recovered: 550, tier: 2, status: 'Active', daysOverdue: 55, aiStage: 'NEGOTIATING', attempts: 9, lastAction: 'Call — no answer', lastActionDate: '2025-08-03' },
  { id: 'D008', name: 'Rachel Gomez', phone: '+15551193820', email: 'rachel@email.com', amount: 780, recovered: 780, tier: 1, status: 'Resolved', daysOverdue: 0, aiStage: 'RESOLVED', attempts: 3, lastAction: 'Full payment received', lastActionDate: '2025-07-20' },
  { id: 'D009', name: 'Michael Torres', phone: '+15554478901', email: 'michael@email.com', amount: 1500, recovered: 0, tier: 3, status: 'Escalated', daysOverdue: 120, aiStage: 'LEGAL_REVIEW', attempts: 21, lastAction: 'Legal review initiated', lastActionDate: '2025-08-01' },
  { id: 'D010', name: 'Aisha Tremblay', phone: '+15557720034', email: 'aisha@email.com', amount: 930, recovered: 465, tier: 2, status: 'Active', daysOverdue: 33, aiStage: 'SOFT_FIRM', attempts: 6, lastAction: 'Follow-up SMS sent', lastActionDate: '2025-08-05' },
];

export const mockClients = [
  { id: 'C001', name: 'QuickCash Loans', industry: 'Payday Loans', accounts: 142, totalDebt: 128400, recovered: 52200, status: 'Active', setupFeePaid: '2025-01-15', setupFee: 299 },
  { id: 'C002', name: 'EasyPay Lending', industry: 'Personal Loans', accounts: 89, totalDebt: 98500, recovered: 41800, status: 'Active', setupFeePaid: '2025-02-03', setupFee: 299 },
  { id: 'C003', name: 'CashNow Advance', industry: 'Cash Advance', accounts: 67, totalDebt: 54200, recovered: 18900, status: 'Active', setupFeePaid: '2025-03-11', setupFee: 299 },
  { id: 'C004', name: 'FlexiLoan Pro', industry: 'BNPL', accounts: 34, totalDebt: 32800, recovered: 14600, status: 'Active', setupFeePaid: '2025-04-20', setupFee: 299 },
  { id: 'C005', name: 'NorthShore Finance', industry: 'Personal Loans', accounts: 201, totalDebt: 184500, recovered: 68200, status: 'Onboarding', setupFeePaid: '2025-07-28', setupFee: 299 },
];

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

export const mockOnboardingApplications = [
  { id: 'APP001', company: 'RapidLoans Inc.', contact: 'Sarah Johnson', email: 'sarah@rapidloans.com', type: 'Payday Loan Company', submitted: '2025-08-01', status: 'Pending', avgLoan: '$500–$1,000', monthlyAccounts: '50–100' },
  { id: 'APP002', company: 'EZ Advance Corp', contact: 'Mike Chen', email: 'mike@ezadvance.com', type: 'Cash Advance', submitted: '2025-07-28', status: 'Approved', avgLoan: '$300–$500', monthlyAccounts: '100–500' },
  { id: 'APP003', company: 'TrustBridge Lending', contact: 'Amy Williams', email: 'amy@trustbridge.com', type: 'Personal Loan Provider', submitted: '2025-07-25', status: 'Pending', avgLoan: '$1,000–$1,500', monthlyAccounts: '10–50' },
  { id: 'APP004', company: 'PayFlex BNPL', contact: 'Jordan Lee', email: 'jordan@payflex.com', type: 'BNPL', submitted: '2025-07-20', status: 'Rejected', avgLoan: '$100–$300', monthlyAccounts: '500+' },
];
