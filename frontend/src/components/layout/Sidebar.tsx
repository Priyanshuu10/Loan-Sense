import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BrainCircuit, FilePlus2, FileText, Gauge, LayoutDashboard, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/applications', label: 'Loan Applications', icon: FileText, end: false },
  { to: '/new', label: 'New Application', icon: FilePlus2, end: false },
  { to: '/analysis', label: 'Risk Analysis', icon: Gauge, end: false },
  { to: '/fraud', label: 'Fraud Detection', icon: ShieldAlert, end: false },
];

export function Sidebar() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .health()
      .then(() => setOnline(true))
      .catch(() => setOnline(false));
  }, []);

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-navy-900 text-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 shadow-lg">
          <BrainCircuit size={22} />
        </span>
        <div>
          <p className="text-[15px] font-bold leading-tight tracking-tight">LoanSense AI</p>
          <p className="mt-0.5 text-[10px] leading-tight text-slate-400">Smarter Lending. Safer Decisions.</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-white/10 text-white shadow-inner' : 'text-slate-300/80 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={17} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Engine status card */}
      <div className="p-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3.5">
          <p className="text-xs font-bold text-slate-200">Demo Engine</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            Transparent heuristic scoring on simulated data — not a real credit model.
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] font-medium">
            <span
              className={`h-2 w-2 rounded-full ${
                online === null ? 'bg-slate-400' : online ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
            />
            <span className={online === false ? 'text-rose-300' : 'text-slate-300'}>
              {online === null ? 'Checking API…' : online ? 'API Online · v0.1' : 'API Offline'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
