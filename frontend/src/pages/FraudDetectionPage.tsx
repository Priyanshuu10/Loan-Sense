import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import type { ApplicationRecord } from '../types';
import { api } from '../services/api';
import { fmtDate } from '../lib/format';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { CenteredSpinner, EmptyState, ErrorState } from '../components/ui/Feedback';
import { DecisionBadge, RiskBadge } from '../components/ui/Badges';
import { FlagList } from '../components/fraud/FlagList';

export function FraudDetectionPage() {
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setApps(await api.getApplications());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load fraud data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <CenteredSpinner label="Loading fraud detection overview…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const allFlags = apps.flatMap((a) => a.analysis.fraud_flags);
  const critical = allFlags.filter((f) => f.severity === 'critical').length;
  const warnings = allFlags.filter((f) => f.severity === 'warning').length;
  const infos = allFlags.filter((f) => f.severity === 'info').length;
  const clean = apps.filter((a) => a.analysis.fraud_flag_count === 0).length;

  const sorted = [...apps].sort(
    (a, b) =>
      b.analysis.critical_flag_count - a.analysis.critical_flag_count ||
      b.analysis.fraud_flag_count - a.analysis.fraud_flag_count,
  );

  return (
    <div>
      <PageHeader
        title="Fraud Detection"
        subtitle="Suspicious inconsistencies flagged for verification — anomalies require verification, they never prove fraud"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShieldAlert} label="Total Flags" value={allFlags.length} note={`${apps.length} applications screened`} tone="amber" />
        <StatCard icon={XCircle} label="Critical Flags" value={critical} note="block auto-approval" tone="rose" />
        <StatCard icon={AlertTriangle} label="Warnings" value={warnings} note={`${infos} informational`} tone="amber" />
        <StatCard icon={CheckCircle2} label="Clean Applications" value={clean} note={`of ${apps.length} total`} tone="emerald" />
      </div>

      <div className="mt-6 space-y-4">
        {apps.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<ShieldCheck size={22} />}
              title="Nothing to screen yet"
              body="Fraud and consistency checks run automatically on every submitted application."
              action={
                <Link to="/new" className="btn-primary">
                  New Application
                </Link>
              }
            />
          </div>
        ) : (
          sorted.map((a) => (
            <div key={a.application_id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="text-sm font-bold text-navy-900">{a.input.full_name}</p>
                    <p className="font-mono text-xs text-slate-400">
                      {a.application_id} · {fmtDate(a.created_at)}
                    </p>
                  </div>
                  <RiskBadge category={a.analysis.risk_category} />
                  <DecisionBadge decision={a.analysis.decision} />
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${
                    a.analysis.critical_flag_count > 0
                      ? 'bg-rose-100 text-rose-700'
                      : a.analysis.fraud_flag_count > 0
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <ShieldAlert size={13} />
                  {a.analysis.fraud_flag_count} flag{a.analysis.fraud_flag_count === 1 ? '' : 's'}
                </span>
              </div>

              <div className="mt-4">
                <FlagList flags={a.analysis.fraud_flags} />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-600">Validation status:</span> {a.analysis.validation_status}
                </p>
                <Link
                  to={`/applications/${a.application_id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  View full analysis <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
