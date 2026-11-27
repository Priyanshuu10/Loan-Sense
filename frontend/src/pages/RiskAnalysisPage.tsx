import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, Gauge } from 'lucide-react';
import type { ApplicationRecord } from '../types';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { CenteredSpinner, EmptyState, ErrorState } from '../components/ui/Feedback';
import { AnalysisReport } from '../components/analysis/AnalysisReport';

export function RiskAnalysisPage() {
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.getApplications();
      setApps(list);
      setSelectedId((current) => current || (list.length > 0 ? list[0].application_id : ''));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analyses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = apps.find((a) => a.application_id === selectedId) ?? null;

  return (
    <div>
      <PageHeader
        title="Risk Analysis"
        subtitle="Inspect the complete AI analysis — score, affordability, flags and reasoning"
      />

      {loading ? (
        <CenteredSpinner label="Loading analyses…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : apps.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Gauge size={22} />}
            title="No analyses yet"
            body="Submit a loan application and the AI engine's full risk analysis will appear here."
            action={
              <Link to="/new" className="btn-primary">
                <FilePlus2 size={15} />
                New Application
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-slate-600">Application</label>
            <select className="input max-w-lg" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {apps.map((a) => (
                <option key={a.application_id} value={a.application_id}>
                  {a.input.full_name} · {a.application_id} · score {a.analysis.risk_score.toFixed(0)}/100 ·{' '}
                  {a.analysis.decision_label}
                </option>
              ))}
            </select>
          </div>
          {selected && <AnalysisReport record={selected} />}
        </>
      )}
    </div>
  );
}
