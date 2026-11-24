import { useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarClock, CalendarOff, Plus, Trash2, Info } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import useFetch from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, CardHeader, ConfirmDialog, EmptyState, Input, PageHeader, cx } from '@/components/ui';
import { DAYS, fmtDate, fmtHour, todayStr } from '@/utils/format';

export default function MySchedule() {
  const { user } = useAuth();
  const { data: leaves = [], reload } = useFetch('/leaves', []);
  const [form, setForm] = useState({ date: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [removing, setRemoving] = useState(null);
  const s = user.schedule;
  const hours = s ? Array.from({ length: s.endHour - s.startHour }, (_, i) => s.startHour + i) : [];
  const leaveDay = form.date ? new Date(`${form.date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long' }) : '';
  const worksThatDay = !form.date || s?.days?.includes(leaveDay);

  const add = async () => {
    setSaving(true);
    try {
      const { data } = await api.post('/leaves', form);
      toast.success(data.cancelled ? `Leave added. ${data.cancelled} appointment(s) cancelled and patients notified.` : 'Leave added');
      setForm({ date: '', reason: '' });
      setConfirm(false);
      reload({ silent: true });
    } catch (e) { toast.error(errMsg(e)); } finally { setSaving(false); }
  };

  const remove = async () => {
    try {
      await api.delete(`/leaves/${removing._id}`);
      toast.success('Leave removed. The day is bookable again.');
      setRemoving(null);
      reload({ silent: true });
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="Schedule & leave" subtitle="Your weekly working hours and days off" />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader title="Weekly schedule" subtitle={s?.days?.length ? `${fmtHour(s.startHour)} – ${fmtHour(s.endHour)} · ${(s.endHour - s.startHour) * 4} slots per day` : 'Not set'} icon={CalendarClock} />
          {s?.days?.length ? (
            <div className="overflow-x-auto p-5">
              <div className="grid min-w-[560px] gap-1" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
                <span />
                {DAYS.map((d) => <span key={d} className="pb-1 text-center text-xs font-bold text-slate-500">{d.slice(0, 3)}</span>)}
                {hours.map((h) => (
                  <div key={h} className="contents">
                    <span className="pr-2 text-right text-[11px] text-slate-400">{fmtHour(h)}</span>
                    {DAYS.map((d) => <span key={d} className={cx('h-7 rounded-md', s.days.includes(d) ? 'bg-brand-500/80' : 'bg-slate-100')} />)}
                  </div>
                ))}
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Info className="size-3.5" />Only an administrator can change your weekly hours.</p>
            </div>
          ) : <EmptyState icon={CalendarClock} title="No schedule yet" message="Ask an administrator to set your working hours." />}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Request a day off" icon={CalendarOff} />
            <div className="space-y-4 p-5">
              <Input label="Date" type="date" min={todayStr()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                hint={form.date && !worksThatDay ? `You don't normally work on ${leaveDay}s.` : undefined} />
              <Input label="Reason (optional)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Conference, personal leave" />
              <Button icon={Plus} disabled={!form.date} onClick={() => setConfirm(true)}>Add leave</Button>
            </div>
          </Card>
          <Card>
            <CardHeader title="Upcoming leave" />
            {leaves.length === 0 ? <p className="p-5 text-sm text-slate-500">No upcoming leave.</p> : (
              <ul className="divide-y divide-slate-100">
                {leaves.map((l) => (
                  <li key={l._id} className="flex items-center gap-3 px-5 py-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><CalendarOff className="size-4" /></span>
                    <div className="flex-1"><p className="text-sm font-semibold">{fmtDate(l.date)}</p><p className="text-xs text-slate-500">{l.reason || 'No reason given'}</p></div>
                    <Button size="sm" variant="dangerSoft" icon={Trash2} onClick={() => setRemoving(l)} title="Remove" />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={add} loading={saving} confirmText="Add leave"
        title={`Take ${form.date ? fmtDate(form.date) : ''} off?`}
        message="Patients can no longer book this day. Any pending or approved appointments on it will be cancelled and the patients notified automatically." />
      <ConfirmDialog open={Boolean(removing)} onClose={() => setRemoving(null)} onConfirm={remove} confirmText="Remove leave"
        title="Remove this leave?" message="The day becomes bookable again. Appointments that were already cancelled are not restored." />
    </>
  );
}
