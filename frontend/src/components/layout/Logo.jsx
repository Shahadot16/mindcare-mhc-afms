import { HeartPulse } from 'lucide-react';
import { cx } from '@/components/ui';

export default function Logo({ light, className }) {
  return (
    <span className={cx('flex items-center gap-2.5', className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand-400 to-indigo-500 text-white shadow-lg shadow-brand-500/25">
        <HeartPulse className="size-5" />
      </span>
      <span className="leading-tight">
        <span className={cx('block font-display text-[17px] font-extrabold', light ? 'text-white' : 'text-slate-900')}>MindCare</span>
        <span className={cx('block text-[10px] font-semibold uppercase tracking-[0.14em]', light ? 'text-brand-200' : 'text-brand-600')}>MHC · AFMS</span>
      </span>
    </span>
  );
}
