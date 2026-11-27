import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { Avatar, EmptyState, StatusBadge } from '@/components/ui';
import { fmtDate, fmtTime } from '@/utils/format';
import { ModeBadge } from '@/components/appointments/VideoCall';

/** Compact list of upcoming appointments. `show` picks whose name to display. */
export default function UpcomingList({ items = [], show = 'doctor', emptyAction }) {
  if (!items.length) {
    return <EmptyState icon={CalendarDays} title="No upcoming appointments" message="Upcoming visits will appear here." action={emptyAction} />;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((a) => {
        const person = show === 'doctor' ? a.doctor : a.patient;
        const d = new Date(`${a.date}T00:00:00`);
        return (
          <li key={a._id}>
            <Link to={`/app/appointments/${a._id}`} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-slate-50">
              <div className="w-12 shrink-0 rounded-xl bg-brand-50 py-1.5 text-center">
                <p className="text-[10px] font-bold uppercase text-brand-600">{d.toLocaleDateString('en-GB', { month: 'short' })}</p>
                <p className="font-display text-lg font-bold leading-none text-brand-700">{d.getDate()}</p>
              </div>
              <Avatar name={person?.fullName} size="sm" className="hidden sm:grid" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{person?.fullName}</p>
                <p className="truncate text-xs text-slate-500">
                  {fmtDate(a.date, { weekday: 'short' })} · {fmtTime(a.startTime)}
                  {show === 'doctor' && a.doctor?.specialization ? ` · ${a.doctor.specialization}` : ''}
                  {show === 'both' ? ` · with ${a.doctor?.fullName}` : ''}
                </p>
              </div>
              {a.mode === 'Video' && <ModeBadge mode="Video" />}
              <StatusBadge status={a.status} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
