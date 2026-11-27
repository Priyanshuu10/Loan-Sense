// TypeScript mirrors of the FastAPI schemas.

export type EmploymentType = 'salaried' | 'self_employed';
export type LoanPurpose = 'personal' | 'home' | 'vehicle' | 'education' | 'business' | 'other';
export type Decision = 'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED';
export type RiskCategory = 'Low' | 'Medium' | 'High';
export type FlagSeverity = 'info' | 'warning' | 'critical';
export type ApplicationFilter = 'all' | 'approved' | 'rejected' | 'manual_review' | 'high_risk';

export interface LoanApplicationInput {
  full_name: string;
  age: number;
  employment_type: EmploymentType;
  employer_name: string;
  years_employment: number;
  monthly_income: number;
  monthly_expenses: number;
  existing_emi: number;
  outstanding_debt: number;
  loan_amount: number;
  tenure_months: number;
  loan_purpose: LoanPurpose;
}

export interface FraudFlag {
  id: string;
  code: string;
  severity: FlagSeverity;
  title: string;
  description: string;
}

export interface ScoreComponent {
  key: string;
  label: string;
  factor_score: number;
  weight: number;
  contribution: number;
  detail: string;
}

export interface FinancialAnalysis {
  monthly_income: number;
  monthly_expenses: number;
  existing_emi: number;
  estimated_new_emi: number;
  total_emi_obligations: number;
  dti_ratio: number;
  disposable_income: number;
  disposable_income_ratio: number;
  loan_to_annual_income: number;
  interest_rate_annual: number;
  loan_amount: number;
  tenure_months: number;
}

export interface RiskAnalysis {
  risk_score: number;
  default_probability: number;
  risk_category: RiskCategory;
  affordability_status: string;
  decision: Decision;
  decision_label: string;
  decision_summary: string;
  reasons: string[];
  recommendation: string;
  next_steps: string[];
  fraud_flags: FraudFlag[];
  fraud_flag_count: number;
  critical_flag_count: number;
  validation_status: string;
  financials: FinancialAnalysis;
  score_components: ScoreComponent[];
  engine_note: string;
}

export interface ApplicationRecord {
  application_id: string;
  created_at: string;
  input: LoanApplicationInput;
  analysis: RiskAnalysis;
}

export interface DashboardTotals {
  total_applications: number;
  approved: number;
  rejected: number;
  manual_review: number;
  high_risk: number;
  avg_risk_score: number;
  total_requested_amount: number;
  avg_loan_amount: number;
}

export interface DistributionPoint {
  name: string;
  value: number;
}

export interface DashboardStats {
  totals: DashboardTotals;
  purpose_distribution: DistributionPoint[];
  risk_distribution: DistributionPoint[];
  decision_distribution: DistributionPoint[];
}

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  expected_outcome: string;
  narrative: string;
  application: LoanApplicationInput;
}

export interface HealthStatus {
  status: string;
  service: string;
  engine: string;
  applications_stored: number;
  timestamp: string;
}
