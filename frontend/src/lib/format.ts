export function inr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function inrCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2).replace(/\.?0+$/, '')}Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(1).replace(/\.0$/, '')}L`;
  if (abs >= 1e3) return `₹${(n / 1e3).toFixed(0)}K`;
  return `₹${Math.round(n)}`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function pct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function scoreColor(score: number): string {
  if (score < 35) return 'text-teal-600';
  if (score <= 65) return 'text-amber-500';
  return 'text-rose-500';
}

export function scoreBarColor(score: number): string {
  if (score < 35) return 'bg-teal-500';
  if (score <= 65) return 'bg-amber-500';
  return 'bg-rose-500';
}
