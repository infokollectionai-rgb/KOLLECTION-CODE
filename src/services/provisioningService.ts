import { apiClient } from '@/lib/apiClient';

export async function registerCompany(payload: Record<string, unknown>) {
  return apiClient.post('/companies/register', payload);
}

export async function testTwilioConnection(account_sid: string, auth_token: string) {
  return apiClient.post('/provision/test-twilio', { account_sid, auth_token });
}

export async function testSendgridConnection(api_key: string) {
  return apiClient.post('/provision/test-sendgrid', { api_key });
}

export async function testVapiConnection(api_key: string, assistant_id: string) {
  return apiClient.post('/provision/test-vapi', { api_key, assistant_id });
}

export async function initiateStripeConnect(companyId: string) {
  return apiClient.post('/stripe/connect/onboard', { company_id: companyId });
}
