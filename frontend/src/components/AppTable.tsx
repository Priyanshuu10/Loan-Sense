import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ApplicationRecord } from '../types';
import { fmtDate, inr, scoreBarColor, scoreColor } from '../lib/format';
import { PURPOSE_LABEL } from '../services/api';
import { DecisionBadge, RiskBadge } from './ui/Badges';

function ScoreCell({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${scoreBarColor(score)}`} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
      <span className={`text-sm font-bold ${scoreColor(score)}`}>{score.toFixed(0)}</span>
    </div>
  );
}

/** Shared applications table used by the Overview and Applications pages. */
export function AppTable({ apps }: { apps: ApplicationRecord[] }) {
  const navigate = useNavigate();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="th">Borrower</th>
            <th className="th">Application ID</th>
            <th className="th">Loan Amount</th>
            <th className="th">Risk Score</th>
            <th className="th">Risk Category</th>
            <th className="th">Decision</th>
            <th className="th">Date</th>
            <th className="th" aria-label="actions" />
          </tr>
        </thead>
        <tbody>
          {apps.map((a) => (
            <tr
              key={a.application_id}
              onClick={() => navigate(`/applications/${a.application_id}`)}
              className="cursor-pointer border-b border-slate-50 transition last:border-0 hover:bg-slate-50"
            >
              <td className="td">
                <p className="font-semibold text-navy-900">{a.input.full_name}</p>
                <p className="text-xs text-slate-400">
                  {PURPOSE_LABEL[a.input.loan_purpose]} · {a.input.tenure_months} months
                </p>
              </td>
              <td className="td font-mono text-xs text-slate-500">{a.application_id}</td>
              <td className="td font-semibold text-navy-900">{inr(a.input.loan_amount)}</td>
              <td className="td">
                <ScoreCell score={a.analysis.risk_score} />
              </td>
              <td className="td">
                <RiskBadge category={a.analysis.risk_category} />
              </td>
              <td className="td">
                <DecisionBadge decision={a.analysis.decision} />
              </td>
              <td className="td whitespace-nowrap text-xs text-slate-400">{fmtDate(a.created_at)}</td>
              <td className="td text-right">
                <ChevronRight size={16} className="inline text-slate-300" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
