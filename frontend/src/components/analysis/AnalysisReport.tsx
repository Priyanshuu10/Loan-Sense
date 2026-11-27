import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Info,
  ListChecks,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ApplicationRecord, Decision } from '../../types';
import { fmtDate, inr, inrCompact } from '../../lib/format';
import { DECISION_VISUALS, RiskBadge } from '../ui/Badges';
import { ScoreGauge } from '../ui/ScoreGauge';
import { FlagList } from '../fraud/FlagList';

const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid #E2E8F0',
  fontSize: 12,
  boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.25)',
} as const;

/**
 * Full AI analysis report — shared by the application detail page and the
 * Risk Analysis page. Covers decision banner, risk score gauge, financial
 * analysis, fraud detection, explainable AI, and recommendations.
 */
export function AnalysisReport({ record, justSubmitted = false }: { record: ApplicationRecord; justSubmitted?: boolean }) {
  const a = record.analysis;
  const app = record.input;
  const fin = a.financials;
  const visuals = DECISION_VISUALS[a.decision as Decision];
  const DecisionIcon = visuals.icon;

  const flowData = [
    { name: 'Income', value: fin.monthly_income, fill: '#0F172A' },
    { name: 'Expenses', value: fin.monthly_expenses, fill: '#94A3B8' },
    { name: 'Existing EMI', value: fin.existing_emi, fill: '#F59E0B' },
    { name: 'New EMI', value: fin.estimated_new_emi, fill: '#2563EB' },
    {
      name: 'Disposable',
      value: fin.disposable_income,
      fill: fin.disposable_income >= 0 ? '#0D9488' : '#F43F5E',
    },
  ];

  const income = fin.monthly_income;
  const dtiTone = fin.dti_ratio <= 40 ? 'text-teal-600' : fin.dti_ratio <= 65 ? 'text-amber-600' : 'text-rose-600';
  const dispTone = fin.disposable_income >= 0 ? 'text-teal-600' : 'text-rose-600';

  return (
    <div className="space-y-5">
      {/* A. Decision banner */}
      <div className={`card border p-5 ${visuals.banner}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <DecisionIcon size={24} className={visuals.text} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                AI Decision{justSubmitted ? ' · Live analysis complete' : ''}
              </p>
              <h2 className={`text-2xl font-bold tracking-tight ${visuals.text}`}>{a.decision_label}</h2>
              <p className="mt-0.5 max-w-xl text-sm text-slate-600">{a.decision_summary}</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Borrower</p>
              <p className="text-sm font-bold text-navy-900">{app.full_name}</p>
              <p className="font-mono text-xs text-slate-400">
                {record.application_id} · {fmtDate(record.created_at)}
              </p>
            </div>
            <RiskBadge category={a.risk_category} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* B. Risk score */}
        <div className="card p-5">
          <div className="card-header -mx-5 -mt-5 mb-4 px-5">
            <p className="card-title">Risk Score</p>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
              {a.risk_category} risk
            </span>
          </div>
          <ScoreGauge score={a.risk_score} category={a.risk_category} />
          <div className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Default probability</span>
              <span className="font-bold text-navy-900">{(a.default_probability * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Affordability</span>
              <span className="font-bold text-navy-900">{a.affordability_status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Critical flags</span>
              <span className={`inline-flex items-center gap-1 font-bold ${a.critical_flag_count > 0 ? 'text-rose-600' : 'text-teal-600'}`}>
                {a.critical_flag_count > 0 ? <XCircle size={14} /> : <BadgeCheck size={14} />}
                {a.critical_flag_count}
              </span>
            </div>
          </div>
          <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
            Score &gt; 65 = high risk · 35–65 = medium · &lt; 35 = low. Default probability is an illustrative
            heuristic mapping of the score, not a validated estimate.
          </p>
        </div>

        {/* C. Financial analysis */}
        <div className="card p-5 lg:col-span-2">
          <div className="card-header -mx-5 -mt-5 mb-4 px-5">
            <p className="card-title">Financial Affordability Analysis</p>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
              ₹{inrCompact(fin.loan_amount).replace('₹', '')} loan · {fin.tenure_months} months
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Monthly Income', value: inr(fin.monthly_income), tone: 'text-navy-900' },
              { label: 'Monthly Expenses', value: inr(fin.monthly_expenses), tone: 'text-navy-900' },
              { label: 'Existing EMI', value: inr(fin.existing_emi), tone: 'text-navy-900' },
              {
                label: 'Estimated New EMI',
                value: inr(fin.estimated_new_emi),
                tone: 'text-navy-900',
                sub: `@ ${fin.interest_rate_annual}% p.a. illustrative`,
              },
              {
                label: 'Debt-to-Income',
                value: `${fin.dti_ratio.toFixed(1)}%`,
                tone: dtiTone,
                sub: 'recommended max 40%',
              },
              {
                label: 'Disposable Income',
                value: inr(fin.disposable_income),
                tone: dispTone,
                sub: 'after expenses + all EMIs',
              },
            ].map((t) => (
              <div key={t.label} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.label}</p>
                <p className={`mt-1 text-base font-bold tracking-tight ${t.tone}`}>{t.value}</p>
                {t.sub && <p className="text-[10px] text-slate-400">{t.sub}</p>}
              </div>
            ))}
          </div>

          <p className="mb-1 mt-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Monthly income vs outflows
          </p>
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={flowData} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF2F7" />
              <XAxis
                type="number"
                tickFormatter={(v) => inrCompact(Number(v))}
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={94}
                tick={{ fontSize: 12, fill: '#334155' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v, n) => [inr(Number(v)), String(n)]}
                cursor={{ fill: 'rgba(15, 23, 42, 0.03)' }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={15}>
                {flowData.map((d) => (
                  <Cell key={d.name} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* DTI progress with recommended ceiling marker */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">Debt-to-income ratio · {fin.dti_ratio.toFixed(1)}%</span>
              <span className="text-slate-400">▲ recommended ceiling 40% · critical 75%</span>
            </div>
            <div className="relative mt-1.5 h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${
                  fin.dti_ratio <= 40 ? 'bg-teal-500' : fin.dti_ratio <= 65 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, fin.dti_ratio)}%` }}
              />
              <div className="absolute -top-0.5 h-3 w-0.5 rounded bg-navy-900/50" style={{ left: '40%' }} />
              <div className="absolute -top-0.5 h-3 w-0.5 rounded bg-navy-900/50" style={{ left: '75%' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* D. Fraud detection */}
        <div className="card p-5 lg:col-span-2">
          <div className="card-header -mx-5 -mt-5 mb-4 px-5">
            <div className="flex items-center gap-2">
              {a.critical_flag_count > 0 ? (
                <ShieldAlert size={16} className="text-rose-500" />
              ) : (
                <ShieldCheck size={16} className="text-teal-600" />
              )}
              <p className="card-title">Fraud &amp; Consistency Detection</p>
            </div>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                a.fraud_flag_count === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {a.fraud_flag_count} anomaly{a.fraud_flag_count === 1 ? '' : 'ies'} detected
            </span>
          </div>
          <FlagList flags={a.fraud_flags} />
          <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
            <Info size={13} className="mt-0.5 shrink-0 text-slate-400" />
            <span>
              <span className="font-semibold text-slate-600">Validation status:</span> {a.validation_status}
            </span>
          </p>
        </div>

        {/* Score transparency */}
        <div className="card p-5">
          <div className="card-header -mx-5 -mt-5 mb-4 px-5">
            <p className="card-title">Score Breakdown</p>
            <BrainCircuit size={16} className="text-blue-600" />
          </div>
          <div className="space-y-3.5">
            {a.score_components.map((c) => (
              <div key={c.key}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[13px] font-medium text-slate-700">
                    {c.label}
                    <span className="ml-1.5 text-[10px] text-slate-400">weight {(c.weight * 100).toFixed(0)}%</span>
                  </p>
                  <p className="text-[13px] font-bold text-navy-900">+{c.contribution.toFixed(1)}</p>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.min(100, c.factor_score)}%` }} />
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{c.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* E. Explainable AI */}
        <div className="card p-5 lg:col-span-2">
          <div className="card-header -mx-5 -mt-5 mb-4 px-5">
            <div className="flex items-center gap-2">
              <SearchCheck size={16} className="text-blue-600" />
              <p className="card-title">Why did LoanSense AI make this decision?</p>
            </div>
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              Explainable AI
            </span>
          </div>
          <ol className="space-y-3">
            {a.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-slate-600">{r}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* F. Recommendation */}
        <div className="card p-5">
          <div className="card-header -mx-5 -mt-5 mb-4 px-5">
            <div className="flex items-center gap-2">
              <ListChecks size={16} className="text-teal-600" />
              <p className="card-title">Recommendation</p>
            </div>
          </div>
          <div className={`rounded-lg border p-4 ${visuals.banner}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recommended action</p>
            <p className="mt-1.5 text-sm font-semibold leading-relaxed text-navy-900">{a.recommendation}</p>
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Next steps</p>
          <ul className="mt-2 space-y-2.5">
            {a.next_steps.map((step) => (
              <li key={step} className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-600">
                <ArrowRight size={14} className="mt-1 shrink-0 text-teal-600" />
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
        <div className="flex items-start gap-3">
          <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
          <p className="text-xs leading-relaxed text-slate-500">
            <span className="font-bold text-slate-600">Demonstration disclaimer:</span> {a.engine_note} The estimated
            EMI uses an illustrative {fin.interest_rate_annual}% p.a. reducing-balance rate, and the default
            probability is a heuristic mapping of the risk score.
          </p>
        </div>
      </div>
    </div>
  );
}
