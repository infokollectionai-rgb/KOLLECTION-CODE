const API_BASE = import.meta.env.VITE_API_URL || 'https://api.kollection.io';
const IS_DEMO = !import.meta.env.VITE_APP_ENV || import.meta.env.VITE_APP_ENV === 'demo';
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export const PLATFORM_DEFAULTS = {
  setupFee: 5000,
  recoveryPct: 50,
  operationsPct: 8,
};

export async function updateClientFees({ companyId, setupFee, recoveryPct, operationsPct, reason }: {
  companyId: string; setupFee: number; recoveryPct: number; operationsPct: number; reason?: string;
}) {
  if (IS_DEMO) {
    await wait(800);
    return {
      success: true, companyId,
      newFees: { setupFee, recoveryPct, operationsPct },
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin@kollection.ca',
      reason,
    };
  }
  const res = await fetch(`${API_BASE}/admin/clients/${companyId}/fees`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setupFee, recoveryPct, operationsPct, reason }),
  });
  return res.json();
}

export async function getClientFeeHistory({ companyId }: { companyId: string }) {
  if (IS_DEMO) {
    await wait(400);
    return [
      { date: '2025-07-01', field: 'recoveryPct', oldValue: 50, newValue: 40, reason: 'Special arrangement — new client promotion', changedBy: 'admin@kollection.ca' },
      { date: '2025-05-15', field: 'setupFee', oldValue: 5000, newValue: 3000, reason: 'Discount for referral partner', changedBy: 'admin@kollection.ca' },
    ];
  }
  const res = await fetch(`${API_BASE}/admin/clients/${companyId}/fee-history`);
  return res.json();
}

export async function getAllClients() {
  if (IS_DEMO) {
    await wait(500);
    return [
      { id: 'C001', name: 'QuickCash Loans Inc.', industry: 'Payday', accounts: 142, setupFee: 5000, recoveryPct: 50, operationsPct: 8, status: 'Active', stripeOk: true, twilioOk: true, vapiOk: true },
      { id: 'C002', name: 'Apex Lending Group', industry: 'Personal', accounts: 89, setupFee: 3000, recoveryPct: 40, operationsPct: 6, status: 'Active', stripeOk: true, twilioOk: true, vapiOk: true },
      { id: 'C003', name: 'ClearPath Finance', industry: 'Auto', accounts: 34, setupFee: 5000, recoveryPct: 50, operationsPct: 8, status: 'Onboarding', stripeOk: false, twilioOk: true, vapiOk: false },
      { id: 'C004', name: 'NorthShore Credit', industry: 'BNPL', accounts: 201, setupFee: 4000, recoveryPct: 45, operationsPct: 7, status: 'Active', stripeOk: true, twilioOk: true, vapiOk: true },
    ];
  }
  const res = await fetch(`${API_BASE}/admin/clients`);
  return res.json();
}
