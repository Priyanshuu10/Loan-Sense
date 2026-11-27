import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, FileText, Search } from 'lucide-react';
import type { ApplicationFilter, ApplicationRecord } from '../types';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { CenteredSpinner, EmptyState, ErrorState } from '../components/ui/Feedback';
import { AppTable } from '../components/AppTable';

const FILTERS: { id: ApplicationFilter; label: string }[] = [
  { id: 'all', label: 'All Applications' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'manual_review', label: 'Manual Review' },
  { id: 'high_risk', label: 'High Risk' },
];

export function ApplicationsPage() {
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ApplicationFilter>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setApps(await api.getApplications());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<ApplicationFilter, number> = { all: apps.length, approved: 0, rejected: 0, manual_review: 0, high_risk: 0 };
    for (const a of apps) {
      if (a.analysis.decision === 'APPROVED') c.approved += 1;
      if (a.analysis.decision === 'REJECTED') c.rejected += 1;
      if (a.analysis.decision === 'MANUAL_REVIEW') c.manual_review += 1;
      if (a.analysis.risk_category === 'High') c.high_risk += 1;
    }
    return c;
  }, [apps]);

  const visible = useMemo(() => {
    let list = apps;
    if (filter === 'approved') list = list.filter((a) => a.analysis.decision === 'APPROVED');
    if (filter === 'rejected') list = list.filter((a) => a.analysis.decision === 'REJECTED');
    if (filter === 'manual_review') list = list.filter((a) => a.analysis.decision === 'MANUAL_REVIEW');
    if (filter === 'high_risk') list = list.filter((a) => a.analysis.risk_category === 'High');
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.input.full_name.toLowerCase().includes(q) ||
          a.application_id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [apps, filter, search]);

  return (
    <div>
      <PageHeader
        title="Loan Applications"
        subtitle="Every application analysed by the LoanSense AI engine"
        actions={
          <Link to="/new" className="btn-primary">
            <FilePlus2 size={16} />
            New Application
          </Link>
        }
      />

      <div className="card">
        {/* Filters + search */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filter === f.id
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
                <span
                  className={`rounded px-1.5 text-[10px] font-bold ${
                    filter === f.id ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                  }`}
                >
                  {counts[f.id]}
                </span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search borrower or ID…"
              className="input w-56 pl-8"
            />
          </div>
        </div>

        {loading ? (
          <CenteredSpinner label="Loading applications…" />
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={load} />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<FileText size={22} />}
            title={search ? 'No applications match your search' : 'No applications in this view'}
            body={
              search
                ? 'Try a different borrower name or application ID.'
                : 'Switch filters or submit a new loan application to get started.'
            }
            action={
              !search ? (
                <Link to="/new" className="btn-primary">
                  <FilePlus2 size={15} />
                  New Application
                </Link>
              ) : undefined
            }
          />
        ) : (
          <AppTable apps={visible} />
        )}
      </div>
    </div>
  );
}
