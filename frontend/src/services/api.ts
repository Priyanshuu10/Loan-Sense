import type {
  ApplicationFilter,
  ApplicationRecord,
  DashboardStats,
  Decision,
  DemoScenario,
  EmploymentType,
  HealthStatus,
  LoanApplicationInput,
  LoanPurpose,
  RiskAnalysis,
} from '../types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Cannot reach the LoanSense AI backend. Is the API server running?');
  }
  if (!res.ok) {
    let message = `Request failed (HTTP ${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) {
        message = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      /* keep default message */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => request<HealthStatus>('/health'),

  getApplications: (filter: ApplicationFilter = 'all') =>
    request<ApplicationRecord[]>(filter === 'all' ? '/applications' : `/applications?filter=${filter}`),

  getApplication: (id: string) => request<ApplicationRecord>(`/applications/${encodeURIComponent(id)}`),

  createApplication: (payload: LoanApplicationInput) =>
    request<ApplicationRecord>('/applications', { method: 'POST', body: JSON.stringify(payload) }),

  analyze: (payload: LoanApplicationInput) =>
    request<{ analysis: RiskAnalysis; stored: boolean; note: string }>('/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getStats: () => request<DashboardStats>('/dashboard/stats'),

  getScenarios: () => request<DemoScenario[]>('/demo/scenarios'),
};

export const DECISION_LABEL: Record<Decision, string> = {
  APPROVED: 'Approved',
  MANUAL_REVIEW: 'Manual Review',
  REJECTED: 'Rejected',
};

export const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  salaried: 'Salaried',
  self_employed: 'Self-employed',
};

export const PURPOSE_LABEL: Record<LoanPurpose, string> = {
  personal: 'Personal',
  home: 'Home Loan',
  vehicle: 'Vehicle',
  education: 'Education',
  business: 'Business',
  other: 'Other',
};
