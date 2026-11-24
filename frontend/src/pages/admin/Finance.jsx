import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp, CalendarDays, Wallet, AlertCircle, Stethoscope, FlaskConical, BadgePercent, CreditCard, BarChart3 } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { Button, Card, CardHeader, EmptyState, ErrorBox, PageHeader, PageLoader, StatCard } from '@/components/ui';
import { addDaysStr, fmtDate, money, todayStr } from '@/utils/format';

// Chart colors (validated: distinct for colour-blind readers; values are always also shown as text)
const C_CONSULT = '#0a8577'; // brand-600
const C_TESTS = '#6366f1'; // indigo-500

const presets = [
  { label: 'Last 7 days', days: 6 },
  { label: 'Last 30 days', days: 29 },
  { label: 'This month', month: true },
  { label: 'Last 90 days', days: 89 },
];

function ChartTooltip({ active, payload, label, labelFmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-semibold text-slate-800">{labelFmt ? labelFmt(label) : label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-slate-600">
          <span className="size-2.5 rounded-sm" style={{ background: p.color }} />{p.name}: <b className="text-slate-800">{money(p.value)}</b>
        </p>
      ))}
    </div>
  );
}

export default function Finance() {
  const today = todayStr();
  const [range, setRange] = useState({ start: `${today.slice(0, 7)}-01`, end: today });
  const { data, loading, error, reload } = useFetch(`/finance?start=${range.start}&end=${range.end}`);

  const applyPreset = (p) => setRange(p.month ? { start: `${today.slice(0, 7)}-01`, end: today } : { start: addDaysStr(today, -p.days), end: today });

  return (
    <>
      <PageHeader title="Financial reports" subtitle="Money received from paid invoices, by date, doctor, test and payment method" />

      <Card className="mb-6 flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => <Button key={p.label} size="sm" variant="secondary" onClick={() => applyPreset(p)}>{p.label}</Button>)}
        </div>
        <div className="flex flex-wrap items-end gap-2 lg:ml-auto">
          <label><span className="label">From</span><input type="date" className="input" max={range.end} value={range.start} onChange={(e) => e.target.value && setRange({ ...range, start: e.target.value })} /></label>
          <label><span className="label">To</span><input type="date" className="input" min={range.start} max={today} value={range.end} onChange={(e) => e.target.value && setRange({ ...range, end: e.target.value })} /></label>
        </div>
      </Card>

      {error ? <ErrorBox message={error} onRetry={reload} /> : loading || !data ? <PageLoader /> : <Report data={data} />}
    </>
  );
}

function Report({ data }) {
  const { summary: s, daily, byDoctor, byTest, byMethod, range } = data;
  const maxMethod = Math.max(1, ...byMethod.map((m) => m.total));
  const short = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={TrendingUp} label="Revenue in range" value={money(s.revenueInRange)} hint={`${s.paidInvoices} paid invoice${s.paidInvoices === 1 ? '' : 's'}`} tone="brand" />
        <StatCard icon={CalendarDays} label="Today" value={money(s.revenueToday)} hint={`This month ${money(s.revenueThisMonth)}`} tone="indigo" />
        <StatCard icon={AlertCircle} label="Outstanding" value={money(s.outstandingAmount)} hint={`${s.outstandingInvoices} unpaid invoice${s.outstandingInvoices === 1 ? '' : 's'}`} tone="amber" />
        <StatCard icon={BadgePercent} label="Follow-up discounts" value={money(s.discountsGiven)} hint={`${s.appointmentsInRange} appointments in range`} tone="violet" />
      </div>

      <Card>
        <CardHeader title="Daily revenue" subtitle={`${fmtDate(range.start)} – ${fmtDate(range.end)}`} icon={BarChart3} />
        <div className="h-72 px-2 py-4 sm:px-4">
          {s.revenueInRange === 0 ? <EmptyState icon={Wallet} title="No payments in this range" message="Try a wider date range." /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#eef2f6" />
                <XAxis dataKey="date" tickFormatter={short} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tickFormatter={(v) => (v >= 1000 ? `৳${v / 1000}k` : `৳${v}`)} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={56} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltip labelFmt={(d) => fmtDate(d)} />} />
                <Bar dataKey="revenue" name="Revenue" fill={C_CONSULT} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Revenue by doctor" subtitle="Consultation and test income" icon={Stethoscope} />
          {byDoctor.length === 0 ? <EmptyState title="No doctor revenue in this range" /> : (<>
            <div className="flex gap-4 px-5 pt-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: C_CONSULT }} />Consultation</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: C_TESTS }} />Tests</span>
            </div>
            <div className="px-2 sm:px-4" style={{ height: Math.max(140, byDoctor.length * 52) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDoctor} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }} barCategoryGap={14}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip />} />
                  <Bar dataKey="consultation" name="Consultation" stackId="a" fill={C_CONSULT} stroke="#fff" strokeWidth={2} maxBarSize={30} isAnimationActive={false} />
                  <Bar dataKey="tests" name="Tests" stackId="a" fill={C_TESTS} stroke="#fff" strokeWidth={2} radius={[0, 4, 4, 0]} maxBarSize={30} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="table-wrap border-t border-slate-100">
              <table className="table">
                <thead><tr><th>Doctor</th><th className="text-right">Visits</th><th className="text-right">Consultation</th><th className="text-right">Tests</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {byDoctor.map((d) => (
                    <tr key={d.doctorId}>
                      <td><p className="font-medium">{d.name}</p><p className="text-xs text-slate-500">{d.specialization}</p></td>
                      <td className="text-right tabular-nums">{d.visits}</td>
                      <td className="text-right tabular-nums">{money(d.consultation)}</td>
                      <td className="text-right tabular-nums">{money(d.tests)}</td>
                      <td className="text-right font-semibold tabular-nums">{money(d.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>)}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Income split" icon={Wallet} />
            <div className="space-y-3 p-5 text-sm">
              {[['Consultation', s.consultationRevenue, C_CONSULT], ['Tests', s.testRevenue, C_TESTS]].map(([label, v, c]) => (
                <div key={label}>
                  <div className="mb-1.5 flex justify-between"><span className="flex items-center gap-2 text-slate-600"><span className="size-2.5 rounded-sm" style={{ background: c }} />{label}</span><b className="tabular-nums">{money(v)}</b></div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${s.revenueInRange ? (v / s.revenueInRange) * 100 : 0}%`, background: c }} /></div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Payment methods" icon={CreditCard} />
            {byMethod.length === 0 ? <p className="p-5 text-sm text-slate-500">No payments in this range.</p> : (
              <ul className="space-y-3.5 p-5 text-sm">
                {byMethod.map((m) => (
                  <li key={m.method}>
                    <div className="mb-1.5 flex justify-between"><span className="font-medium">{m.method} <span className="font-normal text-slate-500">· {m.count}</span></span><b className="tabular-nums">{money(m.total)}</b></div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${(m.total / maxMethod) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Revenue by test" icon={FlaskConical} />
            {byTest.length === 0 ? <p className="p-5 text-sm text-slate-500">No test income in this range.</p> : (
              <ul className="divide-y divide-slate-100">
                {byTest.map((t) => (
                  <li key={t.name} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <span><span className="font-medium">{t.name}</span><span className="text-slate-500"> × {t.count}</span></span>
                    <b className="tabular-nums">{money(t.total)}</b>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
