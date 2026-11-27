import { AlertTriangle, Loader2, RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';

export function CenteredSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
      <Loader2 size={28} className="animate-spin text-blue-600" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function InlineSpinner({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-600">
      <Loader2 size={16} className="animate-spin" />
      {label}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">{icon}</span>
      <div>
        <p className="text-sm font-bold text-navy-900">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{body}</p>
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
        <AlertTriangle size={20} />
      </span>
      <div>
        <p className="text-sm font-bold text-navy-900">Something went wrong</p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">{message}</p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-ghost">
          <RotateCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-500" />
        <p className="text-sm font-medium text-rose-700">{message}</p>
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-xs font-semibold text-rose-500 hover:text-rose-700">
          Dismiss
        </button>
      )}
    </div>
  );
}
