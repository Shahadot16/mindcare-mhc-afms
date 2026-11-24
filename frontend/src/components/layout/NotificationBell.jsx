import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CalendarCheck, Stethoscope, FlaskConical, Receipt, Wallet, AlertTriangle, MessageCircle, AlarmClock, Info, CheckCheck, Video,
} from 'lucide-react';
import { useRealtime } from '@/context/RealtimeContext';
import { cx } from '@/components/ui';

const ICONS = {
  appointment: [CalendarCheck, 'bg-sky-50 text-sky-600'],
  visit: [Stethoscope, 'bg-brand-50 text-brand-600'],
  test: [FlaskConical, 'bg-violet-50 text-violet-600'],
  billing: [Receipt, 'bg-amber-50 text-amber-600'],
  payment: [Wallet, 'bg-emerald-50 text-emerald-600'],
  risk: [AlertTriangle, 'bg-rose-100 text-rose-600'],
  message: [MessageCircle, 'bg-indigo-50 text-indigo-600'],
  reminder: [AlarmClock, 'bg-orange-50 text-orange-600'],
  call: [Video, 'bg-violet-50 text-violet-600'],
  system: [Info, 'bg-slate-100 text-slate-600'],
};

export function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function NotificationBell() {
  const { notifications, unread, markRead, markAllRead } = useRealtime();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  const openItem = (n) => {
    if (!n.read) markRead(n._id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        className="relative grid size-10 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 cursor-pointer">
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-pop">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-display font-bold">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer">
                <CheckCheck className="size-3.5" />Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 && <li className="px-4 py-10 text-center text-sm text-slate-500">You're all caught up.</li>}
            {notifications.map((n) => {
              const [Icon, tone] = ICONS[n.type] || ICONS.system;
              return (
                <li key={n._id}>
                  <button onClick={() => openItem(n)}
                    className={cx('flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 cursor-pointer', !n.read && 'bg-brand-50/40', n.priority === 'high' && !n.read && 'bg-rose-50/60')}>
                    <span className={cx('grid size-9 shrink-0 place-items-center rounded-xl', tone)}><Icon className="size-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={cx('text-sm', n.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900')}>{n.title}</span>
                        {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" />}
                      </span>
                      {n.message && <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{n.message}</span>}
                      <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
