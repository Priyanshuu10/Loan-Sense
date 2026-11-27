import { CheckCircle2, SearchCheck, XCircle } from 'lucide-react';
import type { Decision, FlagSeverity, RiskCategory } from '../../types';

export const DECISION_VISUALS: Record<
  Decision,
  { icon: typeof CheckCircle2; label: string; chip: string; banner: string; text: string; dot: string }
> = {
  APPROVED: {
    icon: CheckCircle2,
    label: 'Approved',
    chip: 'bg-emerald-100 text-emerald-700',
    banner: 'border-emerald-200 bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  MANUAL_REVIEW: {
    icon: SearchCheck,
    label: 'Manual Review',
    chip: 'bg-amber-100 text-amber-700',
    banner: 'border-amber-200 bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  REJECTED: {
    icon: XCircle,
    label: 'Rejected',
    chip: 'bg-rose-100 text-rose-700',
    banner: 'border-rose-200 bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
};

const RISK_STYLES: Record<RiskCategory, string> = {
  Low: 'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20',
  Medium: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  High: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20',
};

export function RiskBadge({ category }: { category: RiskCategory }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${RISK_STYLES[category]}`}>
      {category} Risk
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: Decision }) {
  const s = DECISION_VISUALS[decision];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${s.chip}`}>
      <Icon size={13} />
      {s.label}
    </span>
  );
}

export const SEVERITY_STYLES: Record<
  FlagSeverity,
  { border: string; bg: string; icon: typeof CheckCircle2; iconColor: string; chip: string; label: string }
> = {
  critical: {
    border: 'border-rose-200',
    bg: 'bg-rose-50',
    icon: XCircle,
    iconColor: 'text-rose-600',
    chip: 'bg-rose-100 text-rose-700',
    label: 'Critical',
  },
  warning: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    icon: AlertTriangleIcon,
    iconColor: 'text-amber-600',
    chip: 'bg-amber-100 text-amber-700',
    label: 'Warning',
  },
  info: {
    border: 'border-sky-200',
    bg: 'bg-sky-50',
    icon: InfoIcon,
    iconColor: 'text-sky-600',
    chip: 'bg-sky-100 text-sky-700',
    label: 'Info',
  },
};

// Local aliases to keep the style map above readable.
import { AlertTriangle as AlertTriangleIcon, Info as InfoIcon } from 'lucide-react';
