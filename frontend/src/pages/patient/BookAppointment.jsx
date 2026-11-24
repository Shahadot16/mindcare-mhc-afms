import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Building2, CalendarCheck, Sun, Sunset, Moon, CalendarX2, CheckCircle2, Video } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import useFetch from '@/hooks/useFetch';
import { Avatar, Button, Card, CardHeader, EmptyState, ErrorBox, PageLoader, Spinner, Textarea, cx } from '@/components/ui';
import { addDaysStr, fmtDate, fmtHour, fmtTime, money, todayStr } from '@/utils/format';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function BookAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: doctor, loading, error } = useFetch(`/doctors/${id}`);

  // Next 14 days, highlighting which ones the doctor works
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const s = addDaysStr(todayStr(), i);
    const d = new Date(`${s}T00:00:00`);
    return { date: s, d, dayName: DAY_NAMES[d.getDay()] };
  }), []);

  const [mode, setMode] = useState('In-person');
  const [date, setDate] = useState('');
  const [slotsData, setSlotsData] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slot, setSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);

  const workDays = useMemo(() => doctor?.schedule?.days || [], [doctor]);
  const videoHours = Number.isInteger(doctor?.schedule?.videoStartHour)
    ? { startHour: doctor.schedule.videoStartHour, endHour: doctor.schedule.videoEndHour }
    : { startHour: doctor?.schedule?.startHour, endHour: doctor?.schedule?.endHour };

  useEffect(() => {
    if (doctor && !date) {
      // Skip today if the doctor's shift is already over
      const shiftOver = new Date().getHours() >= (doctor.schedule?.endHour ?? 24);
      const first = days.find((x, i) => workDays.includes(x.dayName) && !(i === 0 && shiftOver));
      if (first) setDate(first.date);
    }
  }, [doctor, date, days, workDays]);

  useEffect(() => {
    if (!date) return;
    setSlot(null);
    setSlotsLoading(true);
    api.get(`/doctors/${id}/slots`, { params: { date, mode } })
      .then(({ data }) => setSlotsData(data))
      .catch((e) => { toast.error(errMsg(e)); setSlotsData(null); })
      .finally(() => setSlotsLoading(false));
  }, [date, id, mode]);

  const groups = useMemo(() => {
    const slots = slotsData?.slots || [];
    return [
      { label: 'Morning', icon: Sun, items: slots.filter((s) => s.time < '12:00') },
      { label: 'Afternoon', icon: Sunset, items: slots.filter((s) => s.time >= '12:00' && s.time < '17:00') },
      { label: 'Evening', icon: Moon, items: slots.filter((s) => s.time >= '17:00') },
    ].filter((g) => g.items.length);
  }, [slotsData]);

  const book = async () => {
    setBooking(true);
    try {
      await api.post('/appointments', { doctorId: id, date, startTime: slot.time, description: reason, mode });
      toast.success('Appointment requested! Staff will confirm it shortly.');
      navigate('/app/my-appointments');
    } catch (e) {
      toast.error(errMsg(e));
      if (e.response?.status === 409) {
        const { data } = await api.get(`/doctors/${id}/slots`, { params: { date, mode } });
        setSlotsData(data); setSlot(null);
      }
    } finally { setBooking(false); }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} />;

  const available = slotsData?.slots?.filter((s) => s.available).length || 0;

  return (
    <>
      <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/app/doctors')} className="mb-4">All doctors</Button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card className="flex flex-wrap items-center gap-4 p-5">
            <Avatar name={doctor.fullName} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-extrabold">{doctor.fullName}</h1>
              <p className="text-sm font-medium text-brand-600">{doctor.specialization}</p>
              <p className="mt-1 text-sm text-slate-500">{workDays.map((d) => d.slice(0, 3)).join(', ')} · {fmtHour(doctor.schedule?.startHour)}–{fmtHour(doctor.schedule?.endHour)}</p>
            </div>
            <div className="text-right"><p className="text-xs text-slate-500">Consultation</p><p className="font-display text-xl font-extrabold">{money(doctor.consultationFee)}</p></div>
          </Card>

          <Card>
            <CardHeader title="1. Visit type" subtitle="Meet the doctor at the clinic, or talk from home over video" />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {[
                { value: 'In-person', icon: Building2, title: 'In-person', text: `15 minutes at the clinic · ${fmtHour(doctor.schedule?.startHour)}–${fmtHour(doctor.schedule?.endHour)}` },
                { value: 'Video', icon: Video, title: 'Video consultation', text: `30 minutes from home · ${fmtHour(videoHours.startHour)}–${fmtHour(videoHours.endHour)}` },
              ].map((m) => (
                <button key={m.value} type="button" onClick={() => { setMode(m.value); setSlot(null); }}
                  className={cx('flex items-start gap-3 rounded-2xl border p-4 text-left transition cursor-pointer',
                    mode === m.value ? (m.value === 'Video' ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200' : 'border-brand-500 bg-brand-50 ring-2 ring-brand-200') : 'border-slate-200 bg-white hover:border-slate-300')}>
                  <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl', m.value === 'Video' ? 'bg-violet-100 text-violet-700' : 'bg-brand-100 text-brand-700')}><m.icon className="size-5" /></span>
                  <span><span className="block font-semibold">{m.title}</span><span className="text-xs text-slate-500">{m.text}</span></span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="2. Choose a date" subtitle="Highlighted days are when the doctor is available" />
            <div className="flex gap-2 overflow-x-auto p-5">
              {days.map((x) => {
                const works = workDays.includes(x.dayName);
                const active = date === x.date;
                return (
                  <button key={x.date} disabled={!works} onClick={() => setDate(x.date)}
                    className={cx('flex w-16 shrink-0 flex-col items-center rounded-2xl border py-2.5 transition',
                      active ? 'border-brand-500 bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                        : works ? 'border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50 cursor-pointer' : 'cursor-not-allowed border-transparent bg-slate-50 text-slate-300')}>
                    <span className={cx('text-[11px] font-semibold uppercase', active ? 'text-white/80' : works ? 'text-slate-500' : '')}>{x.d.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                    <span className="font-display text-xl font-extrabold">{x.d.getDate()}</span>
                    <span className={cx('text-[10px]', active ? 'text-white/80' : 'text-slate-400')}>{x.d.toLocaleDateString('en-GB', { month: 'short' })}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title="3. Pick a time slot" subtitle={date ? `${fmtDate(date)} · ${available} ${mode === 'Video' ? '30-minute video' : ''} slot${available === 1 ? '' : 's'} free` : 'Choose a date first'} />
            <div className="p-5">
              {!workDays.length ? <EmptyState icon={CalendarX2} title="No schedule yet" message="This doctor has not set working hours." />
                : slotsLoading ? <div className="grid place-items-center py-10"><Spinner /></div>
                : !slotsData?.working ? <EmptyState icon={CalendarX2} title="Not available" message="The doctor doesn't work on this day." />
                : available === 0 ? (slotsData.slots.some((s) => !s.booked)
                  ? <EmptyState icon={CalendarX2} title="No more slots today" message="Today's remaining time has passed. Please choose another date." />
                  : <EmptyState icon={CalendarX2} title="Fully booked" message="Every slot on this day is taken. Please try another date." />)
                : (
                  <div className="space-y-5">
                    {groups.map(({ label, icon: Icon, items }) => (
                      <div key={label}>
                        <p className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-600"><Icon className="size-4 text-amber-500" />{label}</p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
                          {items.map((s) => (
                            <button key={s.time} disabled={!s.available} onClick={() => setSlot(s)}
                              className={cx('rounded-xl border py-2 text-sm font-semibold transition',
                                slot?.time === s.time ? 'border-brand-500 bg-brand-600 text-white shadow-md shadow-brand-600/25'
                                  : s.available ? 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50 cursor-pointer'
                                  : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through')}>
                              {fmtTime(s.time)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-6 lg:h-fit">
          <Card>
            <CardHeader title="4. Confirm booking" icon={CalendarCheck} />
            <div className="space-y-4 p-5">
              <dl className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
                <Row k="Doctor" v={doctor.fullName} />
                <Row k="Visit" v={mode === 'Video' ? 'Video consultation (30 min)' : 'In-person (15 min)'} />
                <Row k="Date" v={date ? fmtDate(date) : '—'} />
                <Row k="Time" v={slot ? `${fmtTime(slot.time)} – ${fmtTime(slot.endTime)}` : <span className="text-slate-400">Select a slot</span>} />
                <Row k="Fee" v={money(doctor.consultationFee)} />
              </dl>
              <Textarea label="Reason for visit (optional)" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Briefly describe how you've been feeling…" />
              <Button size="lg" className="w-full" disabled={!slot} loading={booking} onClick={book} icon={CheckCircle2}>Request appointment</Button>
              <p className="text-center text-xs text-slate-500">Staff will approve your request. Pay after the visit.</p>
              {mode === 'Video' && (
                <p className="rounded-xl bg-violet-50 px-3 py-2 text-xs text-violet-800">
                  You can join the call <b>10 minutes before</b> the start time. Please use a quiet, private place with good internet, and allow camera and microphone access.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

const Row = ({ k, v }) => (
  <div className="flex justify-between gap-3"><dt className="text-slate-500">{k}</dt><dd className="text-right font-semibold text-slate-800">{v}</dd></div>
);
