const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api').replace(/\/$/, '');

export interface PlatformDashboardData {
  organisations: Array<Record<string, unknown> & { id: number }>;
  organisationTotal: number;
  requests: Array<Record<string, unknown> & { id: string; status: string }>;
  requestTotal: number;
  pendingTotal: number;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  const payload = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(payload.error || 'Platform request failed.');
  return payload as T;
}

export function getPlatformDashboard(): Promise<PlatformDashboardData> {
  return request<PlatformDashboardData>('/platform/dashboard');
}

export function decideOrganisationRequest(
  requestId: string,
  decision: 'approved' | 'rejected',
): Promise<{ organisationId: number | null }> {
  return request(`/platform/organisation-requests/${encodeURIComponent(requestId)}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision }),
  });
}

export function sendOrganisationDecisionEmail(
  requestId: string,
): Promise<{ sent: boolean; reason?: string }> {
  return request('/notifications/organisation-decision', {
    method: 'POST',
    body: JSON.stringify({ requestId }),
  });
}
