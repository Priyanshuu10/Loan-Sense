import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FilePlus2, SearchCheck, ShieldAlert, XCircle } from 'lucide-react';
import type { DashboardStats, ApplicationRecord } from '../types';
import { api } from '../services/api';
import { inrCompact } from '../lib/format';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { CenteredSpinner, EmptyState, ErrorState } from '../components/ui/Feedback';
import { DecisionBarChart, PurposePieChart, RiskDonutChart } from '../components/charts/Charts';
import { AppTable } from '../components/AppTable';

export function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, a] = await Promise.all([api.getStats(), api.getApplications()]);
      setStats(s);
      setApps(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <CenteredSpinner label="Loading dashboard…" />;
  if (error || !stats) return <ErrorState message={error ?? 'Unknown error.'} onRetry={load} />;

  const t = stats.totals;
  const share = (n: number) => (t.total_applications ? `${Math.round((n / t.total_applications) * 100)}% of portfolio` : '—');

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Portfolio snapshot of AI-analysed loan applications (demo data)"
        actions={
          <Link to="/new" className="btn-primary">
            <FilePlus2 size={16} />
            New Application
          </Link>
        }
      />

      {/* Statistics cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={FilePlus2}
          label="Total Applications"
          value={t.total_applications}
          note={`${inrCompact(t.total_requested_amount)} requested`}
          tone="navy"
        />
        <StatCard icon={CheckCircle2} label="Approved" value={t.approved} note={share(t.approved)} tone="emerald" />
        <StatCard icon={SearchCheck} label="Manual Reviews" value={t.manual_review} note={share(t.manual_review)} tone="amber" />
        <StatCard icon={XCircle} label="Rejected" value={t.rejected} note={share(t.rejected)} tone="rose" />
        <StatCard
          icon={ShieldAlert}
          label="High-Risk Applications"
          value={t.high_risk}
          note={t.total_applications ? `avg score ${t.avg_risk_score.toFixed(0)}/100` : '—'}
          tone="rose"
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="card p-5">
          <p className="card-title">Risk Category Distribution</p>
          <p className="card-subtitle mb-2">Low / Medium / High across all applications</p>
          <RiskDonutChart data={stats.risk_distribution} />
        </div>
        <div className="card p-5">
          <p className="card-title">Approval vs Rejection Statistics</p>
          <p className="card-subtitle mb-2">Decision outcomes produced by the AI engine</p>
          <DecisionBarChart data={stats.decision_distribution} />
        </div>
        <div className="card p-5">
          <p className="card-title">Loan Application Distribution</p>
          <p className="card-subtitle mb-2">Applications by loan purpose</p>
          <PurposePieChart data={stats.purpose_distribution} />
        </div>
      </div>

      {/* Recent applications */}
      <div className="card mt-6 pb-2">
        <div className="card-header">
          <div>
            <p className="card-title">Recent Applications</p>
            <p className="card-subtitle">Click any row to inspect the full risk analysis</p>
          </div>
          <Link
            to="/applications"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>
        {apps.length === 0 ? (
          <EmptyState
            icon={<FilePlus2 size={22} />}
            title="No applications yet"
            body="Submit the first loan application from the New Application page to populate the dashboard."
            action={
              <Link to="/new" className="btn-primary">
                <FilePlus2 size={15} />
                New Application
              </Link>
            }
          />
        ) : (
          <AppTable apps={apps.slice(0, 6)} />
        )}
      </div>
    </div>
  );
}
