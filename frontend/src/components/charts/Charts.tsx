import { CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from 'recharts';
import type { DistributionPoint } from '../../types';

const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid #E2E8F0',
  fontSize: 12,
  boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.25)',
} as const;

const PIE_COLORS = ['#2563EB', '#0D9488', '#6366F1', '#F59E0B', '#14B8A6', '#94A3B8'];
const RISK_COLORS: Record<string, string> = { Low: '#0D9488', Medium: '#F59E0B', High: '#F43F5E' };

function LegendList({ data, colors }: { data: DistributionPoint[]; colors: Record<string, string> | string[] }) {
  const colorFor = (name: string, i: number) =>
    Array.isArray(colors) ? colors[i % colors.length] : (colors[name] ?? '#94A3B8');
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
      {data.map((d, i) => (
        <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorFor(d.name, i) }} />
          {d.name}
          <span className="font-bold text-navy-900">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Loan application distribution by purpose (pie). */
export function PurposePieChart({ data }: { data: DistributionPoint[] }) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2} strokeWidth={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value) => [`${value} application${Number(value) === 1 ? '' : 's'}`, 'Count']}
          />
        </PieChart>
      </ResponsiveContainer>
      <LegendList data={data} colors={PIE_COLORS} />
    </div>
  );
}

/** Risk category distribution (donut). */
export function RiskDonutChart({ data }: { data: DistributionPoint[] }) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2} strokeWidth={2}>
            {data.map((d) => (
              <Cell key={d.name} fill={RISK_COLORS[d.name] ?? '#94A3B8'} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value} application${Number(value) === 1 ? '' : 's'}`, 'Count']} />
        </PieChart>
      </ResponsiveContainer>
      <LegendList data={data} colors={RISK_COLORS} />
    </div>
  );
}

/** Approval vs manual review vs rejection (bar). */
export function DecisionBarChart({ data }: { data: DistributionPoint[] }) {
  const colorFor = (name: string) =>
    name === 'Approved' ? '#10B981' : name === 'Manual Review' ? '#F59E0B' : '#F43F5E';
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F7" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }} />
        <Bar dataKey="value" name="Applications" radius={[6, 6, 0, 0]} barSize={46}>
          {data.map((d) => (
            <Cell key={d.name} fill={colorFor(d.name)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
