import { useMemo, useState } from 'react';
import { Activity, CalendarCheck, Percent, UserPlus, Users, Flame, Gauge } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { Card, CardHeader, ErrorBox, PageHeader, PageLoader, StatCard, StatusBadge, Tabs } from '@/components/ui';
import { fmtDate, fmtHour } from '@/utils/format';

// Sequential scale: one hue (brand teal), light to dark
const STEPS = ['#ecf0f2', '#d5f1f3', '#b0e3e8', '#7bced6', '#3fb0bd', '#1a94a2', '#0d7480', '#0b5f69'];
const DAY_ORDER = [6, 0, 1, 2, 3, 4, 5]; // Sat first, like the Bangladeshi work week

export default function Analytics() {
  const [days, setDays] = useState(60);
  const { data, loading, error, reload } = useFetch(`/finance/operations?days=${days}`);

  const heat = useMemo(() => {
    if (!data) return null;
    const hours = [...new Set(data.heatmap.map((h) => h.hour))].sort((a, b) => a - b);
    const max = Math.max(1, ...data.heatmap.map((h) => h.count));
    const get = (d, h) => data.heatmap.find((x) => x.dayIndex === d && x.hour === h)?.count || 0;
    return { hours, max, get };
  }, [data]);

  return (
    <>
      <PageHeader title="Operations analytics" subtitle="How busy the clinic is, and how well each doctor's time is used"
        action={<Tabs value={days} onChange={setDays} tabs={[{ value: 30, label: '30 days' }, { value: 60, label: '60 days' }, { value: 90, label: '90 days' }]} />} />
      {error ? <ErrorBox message={error} onRetry={reload} /> : loading || !data ? <PageLoader /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
            <StatCard icon={CalendarCheck} label="Appointments" value={data.kpis.appointments} hint={`${fmtDate(data.range.start, { day: 'numeric', month: 'short' })} – today`} tone="brand" />
            <StatCard icon={Percent} label="Completion rate" value={`${data.kpis.completionRate}%`} tone="emerald" />
            <StatCard icon={Activity} label="Cancellation rate" value={`${data.kpis.cancellationRate}%`} tone="rose" />
            <StatCard icon={Users} label="Patients seen" value={data.kpis.uniquePatients} tone="sky" />
            <StatCard icon={UserPlus} label="New sign-ups" value={data.kpis.newPatients} tone="sky" />
          </div>

          <Card>
            <CardHeader title="Busiest times" subtitle="Bookings by weekday and hour (incl. the next 30 days)" icon={Flame} />
            <div className="overflow-x-auto p-5">
              {heat.hours.length === 0 ? <p className="text-sm text-slate-500">No bookings yet.</p> : (
                <div className="inline-grid min-w-full gap-1" style={{ gridTemplateColumns: `48px repeat(${heat.hours.length}, minmax(34px, 1fr))` }}>
                  <span />
                  {heat.hours.map((h) => <span key={h} className="text-center text-[11px] text-slate-400">{fmtHour(h).replace(':00 ', '')}</span>)}
                  {DAY_ORDER.map((d) => (
                    <div key={d} className="contents">
                      <span className="pr-2 text-right text-xs font-semibold leading-8 text-slate-500">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]}</span>
                      {heat.hours.map((h) => {
                        const c = heat.get(d, h);
                        const step = c === 0 ? 0 : Math.max(1, Math.round((c / heat.max) * (STEPS.length - 1)));
                        return (
                          <span key={h} title={`${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]} ${fmtHour(h)}: ${c} booking${c === 1 ? '' : 's'}`}
                            className="grid h-8 place-items-center rounded-md text-[11px] font-semibold transition hover:ring-2 hover:ring-slate-300"
                            style={{ background: STEPS[step], color: step >= 5 ? '#fff' : '#334155' }}>{c || ''}</span>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <span>Fewer</span>{STEPS.map((s) => <span key={s} className="h-3 w-5 rounded-sm" style={{ background: s }} />)}<span>More</span>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader title="Doctor utilisation" subtitle="Booked slots ÷ available slots, past period" icon={Gauge} />
              <div className="space-y-4 p-5">
                {data.utilisation.map((u) => (
                  <div key={u.doctorId}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-semibold">{u.name}</span>
                      <span className="text-slate-500"><b className="text-slate-900">{u.rate}%</b> · {u.booked} / {u.capacity} slots · {u.cancelled} cancelled</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, u.rate)}%` }} /></div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Appointment outcomes" />
              <ul className="space-y-3 p-5">
                {data.status.map((s) => (
                  <li key={s.status} className="flex items-center justify-between gap-3 text-sm">
                    <StatusBadge status={s.status} />
                    <span className="flex-1 border-b border-dashed border-slate-200" />
                    <b className="tabular-nums">{s.count}</b>
                    <span className="w-12 text-right text-slate-500">{data.kpis.appointments ? Math.round((s.count / data.kpis.appointments) * 100) : 0}%</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
