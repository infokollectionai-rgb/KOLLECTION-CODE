const API_BASE = import.meta.env.VITE_API_URL || 'https://api.kollection.io';
const IS_DEMO = !import.meta.env.VITE_APP_ENV || import.meta.env.VITE_APP_ENV === 'demo';
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export const UNIT_COSTS = {
  sms: 0.0079,
  call: 0.052,
  email: 0.001,
};

export async function getMonthlyCosts({ companyId, month, year }: { companyId: string; month: number; year: number }) {
  if (IS_DEMO) {
    await wait(500);
    return {
      period: `${month}/${year}`,
      breakdown: [
        { type: 'SMS', count: 847, unitCost: 0.0079, total: 6.69 },
        { type: 'Voice Call', count: 312, unitCost: 0.052, total: 16.22 },
        { type: 'Voicemail', count: 189, unitCost: 0.013, total: 2.46 },
        { type: 'Email', count: 1024, unitCost: 0.001, total: 1.02 },
      ],
      totalOperationsCost: 26.39,
      grossRecovered: 8420,
      opsFeePct: 8,
      opsFeeAmount: 673.60,
      remainingAfterOps: 7746.40,
      kollectionShare: 3873.20,
      clientShare: 3873.20,
      opsVsActual: { opsFeeCharged: 673.60, actualCost: 26.39, surplus: 647.21 },
    };
  }
  const res = await fetch(`${API_BASE}/operations/costs/${companyId}?month=${month}&year=${year}`);
  return res.json();
}

export async function getCostHistory({ companyId }: { companyId: string }) {
  if (IS_DEMO) {
    await wait(400);
    return [
      { month: 'Jul 2025', sms: 847, calls: 312, emails: 1024, actualCost: 26.39, opsCharged: 673.60 },
      { month: 'Jun 2025', sms: 621, calls: 244, emails: 890, actualCost: 21.10, opsCharged: 728.00 },
      { month: 'May 2025', sms: 512, calls: 198, emails: 740, actualCost: 17.22, opsCharged: 432.00 },
    ];
  }
  const res = await fetch(`${API_BASE}/operations/history/${companyId}`);
  return res.json();
}
