import { useEffect } from 'react';
import { Loader2, X, Inbox } from 'lucide-react';
import { initials } from '@/utils/format';

const cx = (...c) => c.filter(Boolean).join(' ');
export { cx };

const btnVariants = {
  primary: 'bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 focus-visible:ring-brand-200',
  secondary: 'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-200',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-200',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-200',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-200',
  dangerSoft: 'bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-200',
  video: 'bg-violet-600 text-white shadow-sm shadow-violet-600/20 hover:bg-violet-700 focus-visible:ring-violet-200',
};
const btnSizes = { sm: 'h-8 px-3 text-xs gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-12 px-6 text-base gap-2' };

export function Button({ variant = 'primary', size = 'md', loading, icon: Icon, className, children, disabled, ...rest }) {
  return (
    <button
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-xl font-semibold transition outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer',
        btnVariants[variant], btnSizes[size], className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon && <Icon className="size-4" />}
      {children}
    </button>
  );
}

export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="label">{label}</span>}
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span>
        : hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const Input = ({ label, hint, className, ...rest }) => (
  <Field label={label} hint={hint} className={className}><input className="input" {...rest} /></Field>
);
export const Textarea = ({ label, hint, className, rows = 3, ...rest }) => (
  <Field label={label} hint={hint} className={className}><textarea className="input resize-y" rows={rows} {...rest} /></Field>
);
export const Select = ({ label, hint, className, children, ...rest }) => (
  <Field label={label} hint={hint} className={className}><select className="input pr-8" {...rest}>{children}</select></Field>
);

export const Card = ({ className, children, ...rest }) => <div className={cx('card', className)} {...rest}>{children}</div>;

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="size-4.5" /></span>}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-bold">{title}</h3>
          {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

const badgeTones = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
};
export const Badge = ({ tone = 'slate', children, className, dot }) => (
  <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', badgeTones[tone], className)}>
    {dot && <span className="size-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

const statusTone = {
  Pending: 'amber', Approved: 'sky', Completed: 'emerald', Cancelled: 'rose',
  Suggested: 'violet', Accepted: 'sky', Rejected: 'rose',
  Unpaid: 'amber', Paid: 'emerald', Active: 'emerald', Inactive: 'slate',
};
export const StatusBadge = ({ status }) => <Badge tone={statusTone[status] || 'slate'} dot>{status}</Badge>;

export const Spinner = ({ className }) => <Loader2 className={cx('size-6 animate-spin text-brand-600', className)} />;

export const PageLoader = () => (
  <div className="grid min-h-[40vh] place-items-center"><Spinner className="size-8" /></div>
);

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon className="size-7" /></span>
      <h3 className="text-base font-bold">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <span>{message}</span>
      {onRetry && <Button size="sm" variant="dangerSoft" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

const statTones = {
  brand: 'from-brand-500 to-brand-600 shadow-brand-500/30',
  indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/30',
  amber: 'from-amber-400 to-orange-500 shadow-amber-500/30',
  rose: 'from-rose-500 to-pink-600 shadow-rose-500/30',
  sky: 'from-sky-500 to-blue-600 shadow-sky-500/30',
  violet: 'from-violet-500 to-purple-600 shadow-violet-500/30',
  emerald: 'from-emerald-500 to-green-600 shadow-emerald-500/30',
};
export function StatCard({ icon: Icon, label, value, tone = 'brand', hint }) {
  return (
    <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-extrabold tabular-nums text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        <span className={cx('grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br text-white shadow-lg', statTones[tone])}>
          <Icon className="size-5" />
        </span>
      </div>
    </Card>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

const avatarColors = ['bg-brand-100 text-brand-700', 'bg-indigo-100 text-indigo-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700'];
export function Avatar({ name = '', size = 'md', className }) {
  const color = avatarColors[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % avatarColors.length];
  const sz = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg', xl: 'size-20 text-2xl' }[size];
  return <span className={cx('grid shrink-0 place-items-center rounded-full font-bold', color, sz, className)}>{initials(name) || '?'}</span>;
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  const width = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={cx('relative flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl animate-pop sm:rounded-3xl', width)}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="-mr-2 -mt-1 grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 cursor-pointer" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Keep it</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </>}>
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
      {tabs.map((t) => (
        <button key={t.value} onClick={() => onChange(t.value)}
          className={cx('rounded-lg px-3.5 py-1.5 text-sm font-semibold transition cursor-pointer',
            value === t.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
          {t.label}
          {t.count !== undefined && <span className={cx('ml-1.5 rounded-full px-1.5 text-xs', value === t.value ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600')}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
