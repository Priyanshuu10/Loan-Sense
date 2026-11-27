import { AlertTriangle, Info, ShieldCheck, XCircle } from 'lucide-react';
import type { FraudFlag, FlagSeverity } from '../../types';
import { SEVERITY_STYLES } from '../ui/Badges';

/**
 * Renders the list of fraud / inconsistency flags. Every flag is labelled as
 * a suspicious inconsistency requiring verification — never as proven fraud.
 */
export function FlagList({ flags }: { flags: FraudFlag[] }) {
  if (flags.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">No inconsistencies detected</p>
          <p className="mt-0.5 text-xs leading-relaxed text-emerald-700">
            Declared data is internally consistent. Standard document verification still applies before disbursal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {flags.map((flag) => {
        const s = SEVERITY_STYLES[flag.severity];
        const Icon = flag.severity === 'critical' ? XCircle : flag.severity === 'warning' ? AlertTriangle : Info;
        return (
          <li key={flag.id} className={`rounded-lg border ${s.border} ${s.bg} p-3.5`}>
            <div className="flex items-start gap-3">
              <Icon size={16} className={`mt-0.5 shrink-0 ${s.iconColor}`} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-navy-900">{flag.title}</p>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.chip}`}>
                    {s.label}
                  </span>
                  <span className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                    {flag.code}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{flag.description}</p>
                <p className="mt-1 text-[11px] italic text-slate-400">
                  Suspicious inconsistency — requires verification, not proof of fraud.
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
