export function ScoreGauge({ score, category }: { score: number; category: 'Low' | 'Medium' | 'High' }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, score));
  const color = category === 'Low' ? '#0D9488' : category === 'Medium' ? '#F59E0B' : '#F43F5E';

  return (
    <div className="relative mx-auto h-40 w-40">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#EEF2F7" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tracking-tight text-navy-900">{clamped.toFixed(1)}</span>
        <span className="text-xs font-medium text-slate-400">out of 100</span>
      </div>
    </div>
  );
}
