import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, CalendarDays, ArrowRight, UserSearch } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import { Avatar, Button, Card, EmptyState, ErrorBox, PageHeader, Spinner, cx } from '@/components/ui';
import { fmtHour, money } from '@/utils/format';

export default function FindDoctors() {
  const [search, setSearch] = useState('');
  const [spec, setSpec] = useState('');
  const [data, setData] = useState({ doctors: [], specializations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { data: d } = await api.get('/doctors', { params: { search: search || undefined, specialization: spec || undefined } });
        setData((prev) => ({ doctors: d.doctors, specializations: prev.specializations.length ? prev.specializations : d.specializations }));
        setError('');
      } catch (e) { setError(errMsg(e)); } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [search, spec]);

  return (
    <>
      <PageHeader title="Find a doctor" subtitle="Choose a specialist and book a 15-minute consultation slot" />

      <Card className="mb-6 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search by name or specialization…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {['', ...data.specializations].map((s) => (
            <button key={s || 'all'} onClick={() => setSpec(s)}
              className={cx('rounded-full px-3.5 py-1.5 text-sm font-medium transition cursor-pointer',
                spec === s ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </Card>

      {error && <ErrorBox message={error} />}
      {loading ? <div className="grid place-items-center py-16"><Spinner /></div>
        : data.doctors.length === 0 ? <Card><EmptyState icon={UserSearch} title="No doctors found" message="Try a different name or specialization." /></Card>
        : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {data.doctors.map((d) => (
              <Card key={d._id} className="group flex flex-col p-5 transition hover:-translate-y-1 hover:shadow-lift">
                <div className="flex items-start gap-4">
                  <Avatar name={d.fullName} size="lg" />
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold">{d.fullName}</h3>
                    <p className="text-sm font-medium text-brand-600">{d.specialization}</p>
                    <p className="mt-1 font-display text-lg font-extrabold">{money(d.consultationFee)}<span className="text-xs font-medium text-slate-400"> / visit</span></p>
                  </div>
                </div>
                {d.bio && <p className="mt-4 line-clamp-2 text-sm text-slate-600">{d.bio}</p>}
                <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  {d.schedule?.days?.length ? (<>
                    <p className="flex items-center gap-2"><CalendarDays className="size-3.5 text-slate-400" />{d.schedule.days.map((x) => x.slice(0, 3)).join(', ')}</p>
                    <p className="flex items-center gap-2"><Clock className="size-3.5 text-slate-400" />{fmtHour(d.schedule.startHour)} – {fmtHour(d.schedule.endHour)}</p>
                  </>) : <p>Schedule not set yet</p>}
                </div>
                <Link to={`/app/doctors/${d._id}/book`} className="mt-5">
                  <Button className="w-full" disabled={!d.schedule?.days?.length}>Book appointment <ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
    </>
  );
}
