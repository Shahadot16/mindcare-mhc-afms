import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, Pencil, Trash2, CalendarClock, Search, Users, Mail, Phone } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import useFetch from '@/hooks/useFetch';
import { Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, ErrorBox, Input, Modal, PageHeader, PageLoader, Select, StatusBadge, Tabs, cx } from '@/components/ui';
import { DAYS, fmtHour, money } from '@/utils/format';

const roleTone = { Admin: 'violet', Doctor: 'brand', Staff: 'sky', Patient: 'slate' };
const emptyForm = { fullName: '', email: '', password: '', role: 'Doctor', specialization: '', consultationFee: '', contactNumber: '', gender: '', salary: '', commissionRate: '' };

export default function Employees() {
  const { data = [], loading, error, reload } = useFetch('/users', []);
  const [tab, setTab] = useState('Doctor');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null); // null closed; {...} open (with _id when editing)
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [scheduleFor, setScheduleFor] = useState(null);

  const counts = useMemo(() => data.reduce((m, u) => ({ ...m, [u.role]: (m[u.role] || 0) + 1 }), {}), [data]);
  const list = useMemo(() => {
    const s = search.toLowerCase();
    return data.filter((u) => u.role === tab).filter((u) => !s || [u.fullName, u.email, u.specialization].some((x) => x?.toLowerCase().includes(s)));
  }, [data, tab, search]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, consultationFee: Number(form.consultationFee) || 0, salary: Number(form.salary) || 0, commissionRate: Number(form.commissionRate) || 0 };
      if (form._id) {
        if (!body.password) delete body.password;
        await api.put(`/users/${form._id}`, body);
        toast.success('Employee updated');
      } else {
        await api.post('/users', body);
        toast.success(`${form.fullName} was hired as ${form.role}`);
        setTab(form.role);
      }
      setForm(null);
      reload({ silent: true });
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  };

  const remove = async () => {
    setSaving(true);
    try {
      const { data: r } = await api.delete(`/users/${deleting._id}`);
      toast.success(r.message);
      setDeleting(null);
      reload({ silent: true });
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  };

  const toggleActive = async (u) => {
    try {
      await api.put(`/users/${u._id}`, { isActive: !u.isActive });
      toast.success(`${u.fullName} ${u.isActive ? 'deactivated' : 'reactivated'}`);
      reload({ silent: true });
    } catch (err) { toast.error(errMsg(err)); }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Employees & users" subtitle="Hire doctors and staff, set doctor schedules and manage accounts"
        action={<Button icon={UserPlus} onClick={() => setForm({ ...emptyForm, role: tab === 'Patient' ? 'Doctor' : tab })}>Hire employee</Button>} />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onChange={setTab} tabs={['Doctor', 'Staff', 'Admin', 'Patient'].map((r) => ({ value: r, label: r === 'Staff' ? 'Staff' : `${r}s`, count: counts[r] || 0 }))} />
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search name, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {list.length === 0 ? <Card><EmptyState icon={Users} title={`No ${tab.toLowerCase()}s found`} /></Card> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((u) => (
            <Card key={u._id} className={cx('flex flex-col p-5', !u.isActive && 'opacity-60')}>
              <div className="flex items-start gap-3">
                <Avatar name={u.fullName} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{u.fullName}</p>
                  {u.role === 'Doctor' ? <p className="truncate text-sm font-medium text-brand-600">{u.specialization}</p> : <Badge tone={roleTone[u.role]} className="mt-1">{u.role}</Badge>}
                </div>
                <StatusBadge status={u.isActive ? 'Active' : 'Inactive'} />
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-slate-600">
                <p className="flex items-center gap-2 truncate"><Mail className="size-3.5 shrink-0 text-slate-400" />{u.email}</p>
                {u.contactNumber && <p className="flex items-center gap-2"><Phone className="size-3.5 text-slate-400" />{u.contactNumber}</p>}
              </div>
              {u.role === 'Doctor' && (
                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Fee</span><b>{money(u.consultationFee)}</b></div>
                  <div className="mt-1 flex justify-between"><span className="text-slate-500">Pay</span><b>{money(u.salary)}{u.commissionRate ? ` + ${u.commissionRate}%` : ''}</b></div>
                  <div className="mt-2 flex gap-1">
                    {DAYS.map((d) => <span key={d} className={cx('grid h-6 flex-1 place-items-center rounded-md font-bold', u.schedule?.days?.includes(d) ? 'bg-brand-600 text-white' : 'bg-white text-slate-300')}>{d[0]}</span>)}
                  </div>
                  <p className="mt-2 text-slate-500">{u.schedule?.days?.length ? `${fmtHour(u.schedule.startHour)} – ${fmtHour(u.schedule.endHour)}` : 'No schedule'}</p>
                </div>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {u.role !== 'Patient' && <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setForm({ ...emptyForm, ...u, password: '' })}>Edit</Button>}
                {u.role === 'Doctor' && <Button size="sm" variant="soft" icon={CalendarClock} onClick={() => setScheduleFor(u)}>Schedule</Button>}
                <Button size="sm" variant="ghost" onClick={() => toggleActive(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</Button>
                {u.role !== 'Patient' && <Button size="sm" variant="dangerSoft" icon={Trash2} onClick={() => setDeleting(u)} title="Remove" />}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={Boolean(form)} onClose={() => setForm(null)} title={form?._id ? 'Edit employee' : 'Hire employee'} subtitle={form?._id ? form.email : 'Create a login for a new team member'}>
        {form && (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            {!form._id && (
              <div className="sm:col-span-2">
                <span className="label">Role</span>
                <div className="grid grid-cols-3 gap-2">
                  {['Doctor', 'Staff', 'Admin'].map((r) => (
                    <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                      className={cx('rounded-xl border py-2.5 text-sm font-semibold transition cursor-pointer', form.role === r ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100' : 'border-slate-200 hover:border-slate-300')}>{r}</button>
                  ))}
                </div>
              </div>
            )}
            <Input label="Full name" required value={form.fullName} onChange={set('fullName')} className="sm:col-span-2" placeholder={form.role === 'Doctor' ? 'Dr. …' : ''} />
            <Input label="Email" type="email" required value={form.email} onChange={set('email')} />
            <Input label={form._id ? 'New password (optional)' : 'Password'} type="password" required={!form._id} minLength={6} value={form.password} onChange={set('password')} hint="At least 6 characters" />
            <Input label="Phone" value={form.contactNumber} onChange={set('contactNumber')} />
            <Select label="Gender" value={form.gender} onChange={set('gender')}><option value="">—</option><option>Male</option><option>Female</option><option>Other</option></Select>
            <Input label="Monthly salary (৳)" type="number" min={0} value={form.salary} onChange={set('salary')} hint="Used by payroll" />
            {form.role === 'Doctor'
              ? <Input label="Commission (%)" type="number" min={0} max={100} value={form.commissionRate} onChange={set('commissionRate')} hint="Share of paid consultation fees" />
              : <span className="hidden sm:block" />}
            {form.role === 'Doctor' && (<>
              <Input label="Specialization" required value={form.specialization} onChange={set('specialization')} placeholder="e.g. Psychiatrist" list="specs" />
              <datalist id="specs">{['Psychiatrist', 'Clinical Psychologist', 'Child & Adolescent Psychiatrist', 'Addiction Specialist', 'Counselor', 'Neuropsychiatrist'].map((s) => <option key={s} value={s} />)}</datalist>
              <Input label="Consultation fee (৳)" type="number" min={0} required value={form.consultationFee} onChange={set('consultationFee')} />
            </>)}
            {!form._id && form.role === 'Doctor' && <p className="text-xs text-slate-500 sm:col-span-2">New doctors start with a Sunday–Thursday, 9 AM–5 PM schedule. You can change it afterwards.</p>}
            <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit" loading={saving}>{form._id ? 'Save changes' : `Hire ${form.role.toLowerCase()}`}</Button>
            </div>
          </form>
        )}
      </Modal>

      {scheduleFor && <ScheduleModal doctor={scheduleFor} onClose={() => setScheduleFor(null)} onSaved={() => { setScheduleFor(null); reload({ silent: true }); }} />}

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove} loading={saving} danger
        title={`Remove ${deleting?.fullName}?`} confirmText="Remove"
        message="If this person has appointment history, the account is deactivated instead, so past records stay intact." />
    </>
  );
}

function ScheduleModal({ doctor, onClose, onSaved }) {
  const [days, setDays] = useState(doctor.schedule?.days || []);
  const [startHour, setStart] = useState(doctor.schedule?.startHour ?? 9);
  const [endHour, setEnd] = useState(doctor.schedule?.endHour ?? 17);
  // '' = video visits use the same hours as in-person visits
  const [videoStart, setVideoStart] = useState(doctor.schedule?.videoStartHour ?? '');
  const [videoEnd, setVideoEnd] = useState(doctor.schedule?.videoEndHour ?? '');
  const [saving, setSaving] = useState(false);
  const hours = Array.from({ length: 25 }, (_, h) => h);
  const slots = Math.max(0, (endHour - startHour) * 4);
  const ownVideo = videoStart !== '';
  const videoInvalid = ownVideo && (videoEnd === '' || Number(videoStart) >= Number(videoEnd));

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/users/${doctor._id}/schedule`, {
        days, startHour, endHour,
        ...(ownVideo ? { videoStartHour: Number(videoStart), videoEndHour: Number(videoEnd) } : {}),
      });
      toast.success('Schedule saved');
      onSaved();
    } catch (e) { toast.error(errMsg(e)); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="Doctor schedule" subtitle={doctor.fullName}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving} disabled={startHour >= endHour || videoInvalid}>Save schedule</Button></>}>
      <span className="label">Working days</span>
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((d) => {
          const on = days.includes(d);
          return (
            <button key={d} type="button" onClick={() => setDays(on ? days.filter((x) => x !== d) : [...days, d])}
              className={cx('rounded-xl py-3 text-xs font-bold transition cursor-pointer', on ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>
              {d.slice(0, 3)}
            </button>
          );
        })}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4">
        <Select label="Start time" value={startHour} onChange={(e) => setStart(Number(e.target.value))}>{hours.slice(0, 24).map((h) => <option key={h} value={h}>{fmtHour(h)}</option>)}</Select>
        <Select label="End time" value={endHour} onChange={(e) => setEnd(Number(e.target.value))}>{hours.slice(1).map((h) => <option key={h} value={h}>{h === 24 ? '12:00 AM (midnight)' : fmtHour(h)}</option>)}</Select>
      </div>
      <p className={cx('mt-4 rounded-xl px-4 py-3 text-sm', startHour >= endHour ? 'bg-rose-50 text-rose-700' : 'bg-brand-50 text-brand-800')}>
        {startHour >= endHour ? 'End time must be after start time.' : `${slots} fifteen-minute slots per day · ${slots * days.length} per week`}
      </p>
      <span className="label mt-5">Video consultation hours</span>
      <div className="grid grid-cols-2 gap-4">
        <Select value={videoStart} onChange={(e) => { setVideoStart(e.target.value); if (e.target.value === '') setVideoEnd(''); }}>
          <option value="">Same as working hours</option>
          {hours.slice(0, 24).map((h) => <option key={h} value={h}>From {fmtHour(h)}</option>)}
        </Select>
        <Select value={videoEnd} disabled={!ownVideo} onChange={(e) => setVideoEnd(e.target.value)}>
          <option value="">—</option>
          {hours.slice(1).map((h) => <option key={h} value={h}>Until {h === 24 ? '12:00 AM (midnight)' : fmtHour(h)}</option>)}
        </Select>
      </div>
      <p className={cx('mt-2 text-xs', videoInvalid ? 'text-rose-600' : 'text-slate-500')}>
        {videoInvalid ? 'Video end time must be after its start time.' : 'Evening hours (e.g. 6–10 PM) suit patients who work or study. Video visits are 30 minutes.'}
      </p>
      <p className="mt-2 text-xs text-slate-500">Existing bookings are kept even if they fall outside the new hours.</p>
    </Modal>
  );
}
