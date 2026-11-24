import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Stethoscope, CheckCircle2, Users, Clock, FileText } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import { Avatar, Button, Card, CardHeader, EmptyState, ErrorBox, PageLoader, StatCard, StatusBadge, cx } from '@/components/ui';
import UpcomingList from '@/components/appointments/UpcomingList';
import RiskAlerts from '@/components/patients/RiskAlerts';
import DiagnosisModal from '@/components/appointments/DiagnosisModal';
import { JoinCallButton, ModeBadge } from '@/components/appointments/VideoCall';
import { DAYS, fmtDate, fmtHour, fmtTime, greeting, todayStr } from '@/utils/format';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/dashboard');
  const [active, setActive] = useState(null);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { stats, todayList, upcoming, schedule } = data;
  const todayName = new Date().toLocaleDateString('en-GB', { weekday: 'long' });

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">{greeting()} · {fmtDate(todayStr(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{user.fullName}</h1>
          <p className="text-sm font-medium text-brand-600">{user.specialization}</p>
        </div>
        <Link to="/app/doctor/appointments"><Button icon={Stethoscope}>All my patients</Button></Link>
      </div>

      <RiskAlerts />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarDays} label="Today's appointments" value={stats.today} tone="brand" />
        <StatCard icon={Clock} label="Approved, to see" value={stats.toSee} tone="sky" />
        <StatCard icon={CheckCircle2} label="Visits completed" value={stats.completed} tone="emerald" />
        <StatCard icon={Users} label="Unique patients" value={stats.patients} tone="violet" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Today's schedule" subtitle={todayName} icon={Clock} />
          {todayList.length === 0 ? <EmptyState icon={CalendarDays} title="No patients today" message="Enjoy a quieter day." /> : (
            <ol className="relative space-y-1 p-5">
              {todayList.map((a, i) => (
                <li key={a._id} className="relative flex gap-4 pb-4">
                  {i < todayList.length - 1 && <span className="absolute left-[39px] top-10 h-full w-px bg-slate-200" />}
                  <span className="w-14 shrink-0 pt-2 text-right text-xs font-semibold text-slate-500">{fmtTime(a.startTime)}</span>
                  <span className={cx('relative z-10 mt-2.5 size-2.5 shrink-0 rounded-full ring-4', a.status === 'Completed' ? 'bg-emerald-500 ring-emerald-100' : a.status === 'Approved' ? 'bg-sky-500 ring-sky-100' : 'bg-amber-400 ring-amber-100')} />
                  <div className="flex flex-1 flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                    <Avatar name={a.patient.fullName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{a.patient.fullName}</p>
                      <p className="text-xs text-slate-500">{[a.patient.age && `${a.patient.age} yrs`, a.patient.gender].filter(Boolean).join(' · ')}</p>
                    </div>
                    {a.mode === 'Video' && <ModeBadge mode="Video" />}
                    <StatusBadge status={a.status} />
                    <JoinCallButton appointment={a} role="Doctor" />
                    {a.status === 'Approved' && <Button size="sm" variant={a.mode === 'Video' ? 'secondary' : 'primary'} onClick={() => setActive(a)} icon={Stethoscope}>{a.mode === 'Video' ? 'Notes' : 'See patient'}</Button>}
                    {a.status === 'Completed' && <Link to={`/app/appointments/${a._id}`}><Button size="sm" variant="secondary" icon={FileText}>Notes</Button></Link>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="My weekly schedule" icon={CalendarDays} />
            <div className="p-5">
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS.map((d) => {
                  const on = schedule?.days?.includes(d);
                  return (
                    <div key={d} className={cx('rounded-xl py-2.5 text-center text-xs font-bold', on ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400', d === todayName && 'ring-2 ring-offset-2 ring-brand-300')}>
                      {d.slice(0, 2)}
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-slate-600">{schedule?.days?.length ? `${fmtHour(schedule.startHour)} – ${fmtHour(schedule.endHour)}` : 'No schedule set. Ask an admin to set your hours.'}</p>
            </div>
          </Card>
          <Card>
            <CardHeader title="Coming up" icon={CalendarDays} />
            <UpcomingList items={upcoming} show="patient" />
          </Card>
        </div>
      </div>

      {active && <DiagnosisModal appointment={active} onClose={() => setActive(null)} onSaved={() => { setActive(null); reload({ silent: true }); }} />}
    </>
  );
}
