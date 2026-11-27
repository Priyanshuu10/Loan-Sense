import type { LucideIcon } from 'lucide-react';

const TONES = {
  blue: 'bg-blue-50 text-blue-600',
  teal: 'bg-teal-50 text-teal-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  navy: 'bg-navy-900/5 text-navy-900',
} as const;

export function StatCard({
  icon: Icon,
  label,
  value,
  note,
  tone = 'blue',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  note?: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="card p-4">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${TONES[tone]}`}>
        <Icon size={18} />
      </span>
      <p className="mt-3 text-2xl font-bold tracking-tight text-navy-900">{value}</p>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
    </div>
  );
}
