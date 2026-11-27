import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  Building2,
  FlaskConical,
  IndianRupee,
  Loader2,
  RotateCcw,
  UserRound,
  Wallet,
} from 'lucide-react';
import type { DemoScenario, EmploymentType, LoanPurpose } from '../types';
import { api } from '../services/api';
import { ErrorBanner, InlineSpinner } from '../components/ui/Feedback';
import { PageHeader } from '../components/ui/PageHeader';
import type { ReactNode } from 'react';

interface FormState {
  full_name: string;
  age: string;
  employment_type: EmploymentType;
  employer_name: string;
  years_employment: string;
  monthly_income: string;
  monthly_expenses: string;
  existing_emi: string;
  outstanding_debt: string;
  loan_amount: string;
  tenure_months: string;
  loan_purpose: LoanPurpose;
}

const EMPTY_FORM: FormState = {
  full_name: '',
  age: '',
  employment_type: 'salaried',
  employer_name: '',
  years_employment: '',
  monthly_income: '',
  monthly_expenses: '',
  existing_emi: '0',
  outstanding_debt: '0',
  loan_amount: '',
  tenure_months: '60',
  loan_purpose: 'personal',
};

const PURPOSE_OPTIONS: { value: LoanPurpose; label: string }[] = [
  { value: 'personal', label: 'Personal' },
  { value: 'home', label: 'Home Loan' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'education', label: 'Education' },
  { value: 'business', label: 'Business' },
  { value: 'other', label: 'Other' },
];

function outcomeTone(outcome: string): string {
  if (outcome.includes('APPROVED')) return 'bg-emerald-100 text-emerald-700';
  if (outcome.includes('REJECTED')) return 'bg-rose-100 text-rose-700';
  return 'bg-amber-100 text-amber-700';
}

function validate(form: FormState): Record<string, string> {
  const e: Record<string, string> = {};
  if (form.full_name.trim().length < 3) e.full_name = 'Enter the borrower’s full name (min. 3 characters).';

  const age = Number(form.age);
  if (!form.age || !Number.isInteger(age) || age < 18 || age > 75) {
    e.age = 'Age must be a whole number between 18 and 75.';
  }

  if (form.employment_type === 'salaried' && !form.employer_name.trim()) {
    e.employer_name = 'Employer name is required for salaried borrowers.';
  }

  const years = Number(form.years_employment);
  if (form.years_employment === '' || Number.isNaN(years) || years < 0 || years > 50) {
    e.years_employment = 'Enter years of employment (0–50).';
  } else if (Number.isInteger(age) && age >= 18 && years > age - 16) {
    e.years_employment = 'Employment history is inconsistent with the stated age.';
  }

  const income = Number(form.monthly_income);
  if (form.monthly_income === '' || Number.isNaN(income) || income <= 0) {
    e.monthly_income = 'Monthly income must be greater than ₹0.';
  }

  const expenses = Number(form.monthly_expenses);
  if (form.monthly_expenses === '' || Number.isNaN(expenses) || expenses < 0) {
    e.monthly_expenses = 'Enter monthly expenses (0 or more).';
  } else if (!Number.isNaN(income) && income > 0 && expenses > income) {
    e.monthly_expenses = 'Monthly expenses cannot exceed monthly income.';
  }

  const emi = Number(form.existing_emi);
  if (form.existing_emi === '' || Number.isNaN(emi) || emi < 0) {
    e.existing_emi = 'Enter existing monthly EMI (0 or more).';
  }

  const debt = Number(form.outstanding_debt);
  if (form.outstanding_debt === '' || Number.isNaN(debt) || debt < 0) {
    e.outstanding_debt = 'Enter total outstanding debt (0 or more).';
  }

  const amount = Number(form.loan_amount);
  if (form.loan_amount === '' || Number.isNaN(amount) || amount < 10000 || amount > 10000000) {
    e.loan_amount = 'Enter a loan amount between ₹10,000 and ₹1,00,00,000.';
  }

  const tenure = Number(form.tenure_months);
  if (form.tenure_months === '' || !Number.isInteger(tenure) || tenure < 6 || tenure > 360) {
    e.tenure_months = 'Tenure must be between 6 and 360 months.';
  }

  return e;
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="border-b border-slate-100 px-5 py-5 last:border-0">
      <div className="mb-4 flex items-center gap-2 text-navy-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">{icon}</span>
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function NewApplicationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [scenarioNote, setScenarioNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getScenarios()
      .then(setScenarios)
      .catch(() => setScenarios([]));
  }, []);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const loadScenario = useCallback((scenario: DemoScenario) => {
    const a = scenario.application;
    setForm({
      full_name: a.full_name,
      age: String(a.age),
      employment_type: a.employment_type,
      employer_name: a.employer_name,
      years_employment: String(a.years_employment),
      monthly_income: String(a.monthly_income),
      monthly_expenses: String(a.monthly_expenses),
      existing_emi: String(a.existing_emi),
      outstanding_debt: String(a.outstanding_debt),
      loan_amount: String(a.loan_amount),
      tenure_months: String(a.tenure_months),
      loan_purpose: a.loan_purpose,
    });
    setErrors({});
    setSubmitError(null);
    setScenarioNote(`Scenario ${scenario.id} loaded — review the details, then click “Analyze Application”.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScenarioNote(null);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setSubmitError('Please fix the highlighted fields before analysing.');
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const record = await api.createApplication({
        full_name: form.full_name.trim(),
        age: Number(form.age),
        employment_type: form.employment_type,
        employer_name: form.employer_name.trim(),
        years_employment: Number(form.years_employment),
        monthly_income: Number(form.monthly_income),
        monthly_expenses: Number(form.monthly_expenses),
        existing_emi: Number(form.existing_emi),
        outstanding_debt: Number(form.outstanding_debt),
        loan_amount: Number(form.loan_amount),
        tenure_months: Number(form.tenure_months),
        loan_purpose: form.loan_purpose,
      });
      navigate(`/applications/${record.application_id}`, { state: { justSubmitted: true } });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const err = (k: keyof FormState) => errors[k];

  return (
    <div>
      <PageHeader
        title="New Loan Application"
        subtitle="Enter borrower details — the AI engine analyses affordability, risk and consistency"
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Form */}
        <form className="card lg:col-span-2" onSubmit={handleSubmit} noValidate>
          <Section icon={<UserRound size={15} />} title="Personal Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" error={err('full_name')}>
                <input
                  className={`input ${err('full_name') ? 'input-error' : ''}`}
                  value={form.full_name}
                  onChange={set('full_name')}
                  placeholder="e.g. Rahul Sharma"
                />
              </Field>
              <Field label="Age" error={err('age')}>
                <input
                  type="number"
                  className={`input ${err('age') ? 'input-error' : ''}`}
                  value={form.age}
                  onChange={set('age')}
                  placeholder="e.g. 28"
                  min={18}
                  max={75}
                />
              </Field>
              <Field label="Employment Type">
                <select className="input" value={form.employment_type} onChange={set('employment_type')}>
                  <option value="salaried">Salaried</option>
                  <option value="self_employed">Self-employed</option>
                </select>
              </Field>
              <Field label="Employer Name" error={err('employer_name')} hint={form.employment_type === 'self_employed' ? 'Business / firm name' : undefined}>
                <input
                  className={`input ${err('employer_name') ? 'input-error' : ''}`}
                  value={form.employer_name}
                  onChange={set('employer_name')}
                  placeholder="e.g. TCS"
                />
              </Field>
              <Field label="Years of Employment" error={err('years_employment')}>
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  className={`input ${err('years_employment') ? 'input-error' : ''}`}
                  value={form.years_employment}
                  onChange={set('years_employment')}
                  placeholder="e.g. 5"
                />
              </Field>
            </div>
          </Section>

          <Section icon={<Wallet size={15} />} title="Financial Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Monthly Salary / Income (₹)" error={err('monthly_income')}>
                <input
                  type="number"
                  min={0}
                  className={`input ${err('monthly_income') ? 'input-error' : ''}`}
                  value={form.monthly_income}
                  onChange={set('monthly_income')}
                  placeholder="e.g. 90000"
                />
              </Field>
              <Field label="Monthly Expenses (₹)" error={err('monthly_expenses')}>
                <input
                  type="number"
                  min={0}
                  className={`input ${err('monthly_expenses') ? 'input-error' : ''}`}
                  value={form.monthly_expenses}
                  onChange={set('monthly_expenses')}
                  placeholder="e.g. 20000"
                />
              </Field>
              <Field label="Existing Monthly EMI (₹)" error={err('existing_emi')} hint="EMIs of current loans, if any">
                <input
                  type="number"
                  min={0}
                  className={`input ${err('existing_emi') ? 'input-error' : ''}`}
                  value={form.existing_emi}
                  onChange={set('existing_emi')}
                />
              </Field>
              <Field label="Total Outstanding Debt (₹)" error={err('outstanding_debt')}>
                <input
                  type="number"
                  min={0}
                  className={`input ${err('outstanding_debt') ? 'input-error' : ''}`}
                  value={form.outstanding_debt}
                  onChange={set('outstanding_debt')}
                />
              </Field>
            </div>
          </Section>

          <Section icon={<Building2 size={15} />} title="Loan Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Requested Loan Amount (₹)" error={err('loan_amount')}>
                <input
                  type="number"
                  min={10000}
                  className={`input ${err('loan_amount') ? 'input-error' : ''}`}
                  value={form.loan_amount}
                  onChange={set('loan_amount')}
                  placeholder="e.g. 500000"
                />
              </Field>
              <Field label="Loan Tenure (months)" error={err('tenure_months')}>
                <input
                  type="number"
                  min={6}
                  max={360}
                  className={`input ${err('tenure_months') ? 'input-error' : ''}`}
                  value={form.tenure_months}
                  onChange={set('tenure_months')}
                />
              </Field>
              <Field label="Loan Purpose">
                <select className="input" value={form.loan_purpose} onChange={set('loan_purpose')}>
                  {PURPOSE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              {submitting ? (
                <InlineSpinner label="Running AI risk analysis…" />
              ) : (
                <p className="text-xs text-slate-400">
                  Submits the application to the FastAPI engine and stores the full analysis.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setErrors({});
                  setSubmitError(null);
                  setScenarioNote(null);
                }}
                disabled={submitting}
              >
                <RotateCcw size={14} />
                Reset
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                Analyze Application
              </button>
            </div>
          </div>
        </form>

        {/* Right column: demo scenarios + how scoring works */}
        <div className="space-y-5">
          {submitError && <ErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} />}
          {scenarioNote && (
            <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
              {scenarioNote}
            </div>
          )}

          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <FlaskConical size={16} className="text-teal-600" />
              <p className="card-title">Demo Scenarios</p>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-slate-500">
              One-click verified sample profiles for the faculty demonstration. Expected outcomes are produced by the
              live scoring engine, never hardcoded.
            </p>
            <div className="space-y-3">
              {scenarios.map((s) => (
                <div key={s.id} className="rounded-lg border border-slate-200 p-3.5 transition hover:border-blue-300">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-navy-900">{s.title}</p>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${outcomeTone(s.expected_outcome)}`}>
                      {s.expected_outcome}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">{s.subtitle}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{s.narrative}</p>
                  <button type="button" className="btn-ghost mt-3 w-full py-1.5 text-xs" onClick={() => loadScenario(s)}>
                    Load Scenario {s.id} Data
                  </button>
                </div>
              ))}
              {scenarios.length === 0 && (
                <p className="text-xs text-slate-400">Scenario data unavailable — is the API server running?</p>
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <BrainCircuit size={16} className="text-blue-600" />
              <p className="card-title">How the AI engine evaluates</p>
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-500">
              <li className="flex gap-2">
                <IndianRupee size={13} className="mt-0.5 shrink-0 text-teal-600" />
                Estimates the new EMI at an illustrative 10.5% p.a. reducing-balance rate.
              </li>
              <li className="flex gap-2">
                <IndianRupee size={13} className="mt-0.5 shrink-0 text-teal-600" />
                Computes debt-to-income ratio and monthly disposable income after all EMIs.
              </li>
              <li className="flex gap-2">
                <BrainCircuit size={13} className="mt-0.5 shrink-0 text-blue-600" />
                Weighs 7 transparent risk factors into a 0–100 score (higher = riskier).
              </li>
              <li className="flex gap-2">
                <FlaskConical size={13} className="mt-0.5 shrink-0 text-amber-500" />
                Flags suspicious inconsistencies (income vs age vs obligations, duplicates) for verification.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
