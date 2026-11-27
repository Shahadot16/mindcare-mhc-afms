import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Moon, Save, Smile, Flame, TrendingUp, CalendarCheck2 } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import useFetch from '@/hooks/useFetch';
import { Button, Card, CardHeader, ErrorBox, PageHeader, PageLoader, StatCard, Tabs, Textarea, cx } from '@/components/ui';
import { addDaysStr, fmtDate, todayStr } from '@/utils/format';
import { MOODS } from '@/constants/mood';

const C_MOOD = '#0d7480';

export default function Wellbeing() {
  const [range, setRange] = useState(30);
  const { data, loading, error, reload } = useFetch(`/moods/mine?days=${range}`);
  const [form, setForm] = useState({ mood: 0, emotions: [], sleepHours: '', anxiety: '', note: '' });
  const [saving, setSaving] = useState(false);
  const today = todayStr();

  const todayEntry = data?.entries.find((e) => e.date === today);
  useEffect(() => {
    if (todayEntry) setForm({ mood: todayEntry.mood, emotions: todayEntry.emotions, sleepHours: todayEntry.sleepHours ?? '', anxiety: todayEntry.anxiety ?? '', note: todayEntry.note || '' });
  }, [todayEntry?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    if (!data) return null;
    const e = data.entries;
    const avg = (k) => { const v = e.filter((x) => x[k] != null); return v.length ? Math.round((v.reduce((s, x) => s + x[k], 0) / v.length) * 10) / 10 : null; };
    let streak = 0;
    for (let d = today; e.some((x) => x.date === d); d = addDaysStr(d, -1)) streak++;
    const half = Math.floor(e.length / 2);
    const trend = e.length >= 6 ? (e.slice(half).reduce((s, x) => s + x.mood, 0) / (e.length - half)) - (e.slice(0, half).reduce((s, x) => s + x.mood, 0) / half) : 0;
    const counts = {};
    for (const x of e) for (const em of x.emotions) counts[em] = (counts[em] || 0) + 1;
    return { avgMood: avg('mood'), avgSleep: avg('sleepHours'), streak, trend, emotions: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8), logged: e.length };
  }, [data, today]);

  // Fill missing days so the chart shows gaps honestly
  const series = useMemo(() => {
    if (!data) return [];
    const map = new Map(data.entries.map((x) => [x.date, x]));
    const out = [];
    for (let d = data.from; d <= data.to; d = addDaysStr(d, 1)) out.push({ date: d, mood: map.get(d)?.mood ?? null, sleep: map.get(d)?.sleepHours ?? null });
    return out;
  }, [data]);

  const save = async () => {
    if (!form.mood) return toast.error('Pick how you feel today');
    setSaving(true);
    try {
      await api.put('/moods', { ...form, date: today });
      toast.success(todayEntry ? 'Today’s check-in updated' : 'Check-in saved. Nice work looking after yourself.');
      reload({ silent: true });
    } catch (e) { toast.error(errMsg(e)); } finally { setSaving(false); }
  };

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const toggle = (em) => setForm((f) => ({ ...f, emotions: f.emotions.includes(em) ? f.emotions.filter((x) => x !== em) : [...f.emotions, em] }));

  return (
    <>
      <PageHeader title="Mood tracker" subtitle="A one-minute daily check-in. Your doctor sees the trend before each visit." />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="h-fit">
          <CardHeader title={todayEntry ? 'Update today’s check-in' : 'How are you feeling today?'} subtitle={fmtDate(today, { weekday: 'long', day: 'numeric', month: 'long' })} icon={Smile} />
          <div className="space-y-5 p-5">
            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((m) => (
                <button key={m.value} type="button" onClick={() => setForm({ ...form, mood: m.value })}
                  className={cx('flex flex-col items-center gap-1 rounded-2xl border py-3 transition cursor-pointer',
                    form.mood === m.value ? `${m.tone} border-transparent ring-2` : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50')}>
                  <span className={cx('text-3xl transition', form.mood === m.value ? 'scale-110' : 'grayscale-[40%]')}>{m.emoji}</span>
                  <span className="text-[11px] font-semibold text-slate-600">{m.label}</span>
                </button>
              ))}
            </div>
            <div>
              <span className="label">What emotions are you noticing?</span>
              <div className="flex flex-wrap gap-2">
                {(data?.emotions || []).map((em) => (
                  <button key={em} type="button" onClick={() => toggle(em)}
                    className={cx('rounded-full px-3 py-1.5 text-sm font-medium transition cursor-pointer',
                      form.emotions.includes(em) ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{em}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label><span className="label">Hours of sleep</span>
                <input type="number" min={0} max={24} step={0.5} className="input" value={form.sleepHours} onChange={(e) => setForm({ ...form, sleepHours: e.target.value })} placeholder="e.g. 7" /></label>
              <label><span className="label">Anxiety (0–10)</span>
                <input type="range" min={0} max={10} className="mt-3 w-full accent-brand-600" value={form.anxiety === '' ? 0 : form.anxiety} onChange={(e) => setForm({ ...form, anxiety: Number(e.target.value) })} />
                <span className="text-xs text-slate-500">{form.anxiety === '' ? 'Not set' : `${form.anxiety} / 10`}</span>
              </label>
            </div>
            <Textarea label="Journal (optional, private to you and your doctors)" rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="What happened today? What helped?" />
            <Button className="w-full" size="lg" icon={Save} loading={saving} onClick={save}>{todayEntry ? 'Update check-in' : 'Save check-in'}</Button>
          </div>
        </Card>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 2xl:grid-cols-4">
            <StatCard icon={Smile} label="Average mood" value={stats.avgMood ? `${stats.avgMood} / 5` : '—'} tone="brand" />
            <StatCard icon={Flame} label="Check-in streak" value={`${stats.streak} day${stats.streak === 1 ? '' : 's'}`} tone="amber" />
            <StatCard icon={Moon} label="Average sleep" value={stats.avgSleep ? `${stats.avgSleep} h` : '—'} tone="sky" />
            <StatCard icon={TrendingUp} label="Trend" value={stats.trend > 0.25 ? 'Improving' : stats.trend < -0.25 ? 'Dipping' : 'Steady'} hint={`${stats.logged} days logged`} tone={stats.trend < -0.25 ? 'rose' : 'emerald'} />
          </div>

          <Card>
            <CardHeader title="Mood over time" icon={CalendarCheck2}
              action={<Tabs value={range} onChange={setRange} tabs={[{ value: 14, label: '14d' }, { value: 30, label: '30d' }, { value: 90, label: '90d' }]} />} />
            <div className="h-64 px-2 py-4 sm:px-4">
              {stats.logged === 0 ? <p className="grid h-full place-items-center text-sm text-slate-500">Your first check-in will start the chart.</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C_MOOD} stopOpacity={0.25} /><stop offset="100%" stopColor={C_MOOD} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#eef2f6" />
                    <XAxis dataKey="date" tickFormatter={(d) => fmtDate(d, { day: 'numeric', month: 'short' })} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} minTickGap={28} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickFormatter={(v) => MOODS[v - 1].emoji} tick={{ fontSize: 14 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip content={({ active, payload, label }) => active && payload?.[0]?.value ? (
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
                        <p className="font-semibold">{fmtDate(label)}</p>
                        <p className="text-slate-600">{MOODS[payload[0].value - 1].emoji} {MOODS[payload[0].value - 1].label}{payload[0].payload.sleep != null ? ` · ${payload[0].payload.sleep}h sleep` : ''}</p>
                      </div>
                    ) : null} />
                    <Area type="monotone" dataKey="mood" stroke={C_MOOD} strokeWidth={2} fill="url(#moodFill)" connectNulls dot={{ r: 3, fill: C_MOOD, strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Most frequent emotions" />
              <div className="space-y-3 p-5">
                {stats.emotions.length === 0 && <p className="text-sm text-slate-500">Tag emotions in your check-ins to see patterns.</p>}
                {stats.emotions.map(([em, n]) => (
                  <div key={em} className="text-sm">
                    <div className="mb-1 flex justify-between"><span className="font-medium">{em}</span><span className="text-slate-500">{n}×</span></div>
                    <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${(n / stats.emotions[0][1]) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Recent journal" />
              <ul className="divide-y divide-slate-100">
                {[...data.entries].reverse().filter((x) => x.note).slice(0, 5).map((x) => (
                  <li key={x._id} className="flex gap-3 px-5 py-3 text-sm">
                    <span className="text-xl">{MOODS[x.mood - 1].emoji}</span>
                    <div><p className="text-xs text-slate-500">{fmtDate(x.date)}</p><p className="text-slate-700">{x.note}</p></div>
                  </li>
                ))}
                {!data.entries.some((x) => x.note) && <li className="px-5 py-4 text-sm text-slate-500">Journal notes you write will appear here.</li>}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
