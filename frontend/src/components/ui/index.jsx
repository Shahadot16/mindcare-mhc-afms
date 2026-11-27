import { useEffect, useId, useRef } from 'react';
import { Loader2, X, Inbox, AlertCircle } from 'lucide-react';
import { initials } from '@/utils/format';

const cx = (...c) => c.filter(Boolean).join(' ');
export { cx };

/* Buttons step up 1px on hover and press down on click; the global focus ring handles keyboard focus. */
const btnVariants = {
  primary: 'bg-brand-600 text-white shadow-sm shadow-brand-900/10 hover:bg-brand-700',
  secondary: 'bg-white text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50 hover:border-slate-300 hover:text-ink',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-ink',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  dangerSoft: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  dark: 'bg-ink text-white shadow-sm hover:bg-slate-800',
  video: 'bg-sky-700 text-white shadow-sm shadow-sky-900/10 hover:bg-sky-800',
};
const btnSizes = { sm: 'min-h-9 px-3 text-xs gap-1.5', md: 'min-h-11 px-4 text-sm gap-2', lg: 'min-h-12 px-6 text-base gap-2' };

export function Button({ variant = 'primary', size = 'md', loading, icon: Icon, className, children, disabled, ...rest }) {
  return (
    <button
      className={cx(
        'inline-flex shrink-0 select-none items-center justify-center rounded-xl font-semibold transition duration-200',
        'enabled:hover:-translate-y-px enabled:active:translate-y-0 enabled:active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-55',
        btnVariants[variant], btnSizes[size], className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : Icon && <Icon className="size-4" aria-hidden />}
      {children}
    </button>
  );
}

export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="label">{label}</span>}
      {children}
      {error ? <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600"><AlertCircle className="size-3.5" aria-hidden />{error}</span>
        : hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const Input = ({ label, hint, error, className, ...rest }) => (
  <Field label={label} hint={hint} error={error} className={className}>
    <input className={cx('input', error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100')} aria-invalid={error ? true : undefined} {...rest} />
  </Field>
);
export const Textarea = ({ label, hint, error, className, rows = 3, ...rest }) => (
  <Field label={label} hint={hint} error={error} className={className}><textarea className="input resize-y" rows={rows} {...rest} /></Field>
);
export const Select = ({ label, hint, error, className, children, ...rest }) => (
  <Field label={label} hint={hint} error={error} className={className}><select className="input pr-8" {...rest}>{children}</select></Field>
);

export const Card = ({ className, children, ...rest }) => <div className={cx('card', className)} {...rest}>{children}</div>;

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
      <div className="flex min-w-[min(100%,13rem)] flex-1 items-center gap-3">
        {Icon && <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100"><Icon className="size-4.5" aria-hidden /></span>}
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
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  sky: 'bg-sky-50 text-sky-800 ring-sky-200',
  blue: 'bg-blue-50 text-blue-800 ring-blue-200',
  emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  brand: 'bg-brand-50 text-brand-800 ring-brand-200',
};
badgeTones.violet = badgeTones.blue; // old tone name, kept so nothing breaks
badgeTones.indigo = badgeTones.blue;

export const Badge = ({ tone = 'slate', children, className, dot }) => (
  <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', badgeTones[tone] || badgeTones.slate, className)}>
    {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
    {children}
  </span>
);

const statusTone = {
  Pending: 'amber', Approved: 'sky', Completed: 'emerald', Cancelled: 'rose',
  Suggested: 'blue', Accepted: 'sky', Rejected: 'rose',
  Unpaid: 'amber', Paid: 'emerald', Active: 'emerald', Inactive: 'slate',
};
export const StatusBadge = ({ status }) => <Badge tone={statusTone[status] || 'slate'} dot>{status}</Badge>;

export const Spinner = ({ className }) => <Loader2 className={cx('size-6 animate-spin text-brand-600', className)} aria-label="Loading" />;

/* Skeleton blocks reserve the layout while data loads, so nothing jumps (ui-ux-pro-max: CLS) */
export const Skeleton = ({ className }) => <div className={cx('animate-pulse rounded-xl bg-slate-200/70', className)} aria-hidden />;

export const PageLoader = () => (
  <div className="space-y-6" role="status" aria-label="Loading">
    <div className="space-y-2"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-80 max-w-full" /></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
    </div>
    <Skeleton className="h-72 rounded-2xl" />
  </div>
);

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100"><Icon className="size-7" aria-hidden /></span>
      <h3 className="text-base font-bold">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <span className="flex items-center gap-2"><AlertCircle className="size-4 shrink-0" aria-hidden />{message}</span>
      {onRetry && <Button size="sm" variant="dangerSoft" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

/* Stat tiles: a tinted icon chip and a thin accent line, no loud gradients */
const statTones = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-100',
  sky: 'bg-sky-50 text-sky-700 ring-sky-100',
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
};
statTones.indigo = statTones.sky;
statTones.violet = statTones.blue;

export function StatCard({ icon: Icon, label, value, tone = 'brand', hint }) {
  return (
    <Card className="group relative overflow-hidden p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[13px] font-medium leading-snug text-slate-500 sm:text-sm">{label}</p>
        <span className={cx('grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset transition group-hover:scale-105 sm:size-11', statTones[tone] || statTones.brand)}>
          <Icon className="size-4 sm:size-5" aria-hidden />
        </span>
      </div>
      <p className="mt-1.5 break-words font-display text-[22px] font-bold leading-tight tabular-nums text-ink sm:mt-1 sm:text-[26px]">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

export function PageHeader({ title, subtitle, action, eyebrow }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-sm font-semibold text-brand-700">{eyebrow}</p>}
        <h1 className="text-2xl font-bold sm:text-[30px] sm:leading-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-[15px] text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2 [&>*]:max-sm:flex-1">{action}</div>}
    </div>
  );
}

const avatarColors = ['bg-brand-100 text-brand-800', 'bg-sky-100 text-sky-800', 'bg-amber-100 text-amber-800', 'bg-rose-100 text-rose-800', 'bg-emerald-100 text-emerald-800', 'bg-slate-200 text-slate-700'];
export function Avatar({ name = '', size = 'md', className }) {
  const color = avatarColors[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % avatarColors.length];
  const sz = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg', xl: 'size-20 text-2xl' }[size];
  return <span className={cx('grid shrink-0 place-items-center rounded-full font-bold', color, sz, className)} aria-hidden>{initials(name) || '?'}</span>;
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  const titleId = useId();
  const panel = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    // Move focus into the dialog so keyboard and screen-reader users land in it
    requestAnimationFrame(() => {
      const first = panel.current?.querySelector('input, select, textarea, button:not([data-close])');
      (first || panel.current)?.focus();
    });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prevFocus?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  const width = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm animate-[fade-up_.2s_ease-out_both]" onClick={onClose} />
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className={cx('relative flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl outline-none animate-pop sm:rounded-3xl', width)}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 id={titleId} className="text-lg font-bold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button data-close onClick={onClose} className="-mr-2 -mt-1 grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">{footer}</div>}
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
    <div role="tablist" className="inline-flex max-w-full flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cx('min-h-9 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition',
            value === t.value ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700')}>
          {t.label}
          {t.count !== undefined && <span className={cx('ml-1.5 rounded-full px-1.5 text-xs tabular-nums', value === t.value ? 'bg-brand-100 text-brand-800' : 'bg-slate-200 text-slate-600')}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
