import { cx } from '@/components/ui';

/** MindCare mark: the initial on a flat teal tile, then the name. */
export default function Logo({ light, compact, className }) {
  return (
    <span className={cx('flex items-center gap-2.5 whitespace-nowrap', className)}>
      <span aria-hidden className={cx(
        'grid size-9 place-items-center rounded-[11px] font-display text-[19px] font-bold leading-none',
        light ? 'bg-brand-400 text-ink' : 'bg-brand-600 text-white'
      )}>
        M
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={cx('block font-display text-[18px] font-bold tracking-tight', light ? 'text-white' : 'text-ink')}>MindCare</span>
          <span className={cx('block text-[11px] font-medium', light ? 'text-slate-400' : 'text-slate-500')}>Mental health clinic</span>
        </span>
      )}
    </span>
  );
}
