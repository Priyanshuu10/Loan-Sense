import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, FileSearch } from 'lucide-react';
import type { ApplicationRecord } from '../types';
import { api } from '../services/api';
import { CenteredSpinner, ErrorState } from '../components/ui/Feedback';
import { AnalysisReport } from '../components/analysis/AnalysisReport';

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const justSubmitted = (location.state as { justSubmitted?: boolean } | null)?.justSubmitted === true;

  const [record, setRecord] = useState<ApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setRecord(await api.getApplication(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load the application.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <CenteredSpinner label="Retrieving application analysis…" />;
  if (error || !record) {
    return (
      <div>
        <Link to="/applications" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600">
          <ArrowLeft size={15} />
          Back to Applications
        </Link>
        <ErrorState message={error ?? 'Application not found.'} onRetry={load} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={15} />
          Back to Applications
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-500">
          <FileSearch size={13} />
          {record.application_id}
        </span>
      </div>
      <AnalysisReport record={record} justSubmitted={justSubmitted} />
    </div>
  );
}
