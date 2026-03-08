const IS_DEMO = true;

export async function createPaymentLink({ debtorId, amount, description }: { debtorId: string; amount: number; description: string }) {
  if (IS_DEMO) {
    const id = Math.random().toString(36).substr(2, 8).toUpperCase();
    return {
      url: `https://buy.stripe.com/demo_${id}`,
      linkId: id,
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    };
  }
  return { url: '', linkId: '', expiresAt: '' };
}

export async function connectStripeAccount({ companyId, email }: { companyId: string; email: string }) {
  if (IS_DEMO) {
    return { onboardingUrl: 'https://connect.stripe.com/demo' };
  }
  return { onboardingUrl: '' };
}
