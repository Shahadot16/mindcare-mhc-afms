import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Scale, TrendingUp, TrendingDown, Download, Wallet, PiggyBank, Banknote } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { Badge, Button, Card, CardHeader, ErrorBox, PageHeader, PageLoader, StatCard, Tabs, cx } from '@/components/ui';
import { downloadCSV } from '@/utils/csv';
import { money } from '@/utils/format';

const C_REV = '#0d7480';
const C_COST = '#c2703d'; // warm clay for costs
const short = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
const long = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const k = (v) => (Math.abs(v) >= 1000 ? `৳${Math.round(v / 1000)}k` : `৳${v}`);

export default function ProfitLoss() {
  const [months, setMonths] = useState(6);
  const { data, loading, error, reload } = useFetch(`/finance/pnl?months=${months}`);

  return (
    <>
      <PageHeader title="Profit & loss" subtitle="Revenue received minus expenses and payroll, month by month"
        action={<>
          <Tabs value={months} onChange={setMonths} tabs={[{ value: 3, label: '3M' }, { value: 6, label: '6M' }, { value: 12, label: '12M' }]} />
          {data && <Button variant="secondary" icon={Download} onClick={() => downloadCSV(`profit_loss_${months}m.csv`, data.rows, [
            { key: 'month', label: 'Month' }, { key: 'revenue', label: 'Revenue' }, { key: 'consultation', label: 'Consultation' }, { key: 'tests', label: 'Tests' },
            { key: 'expenses', label: 'Expenses' }, { key: 'payroll', label: 'Payroll' }, { key: 'profit', label: 'Net profit' }, { key: (r) => (r.margin ?? ''), label: 'Margin %' },
          ])}>Export CSV</Button>}
        </>} />

      {error ? <ErrorBox message={error} onRetry={reload} /> : loading || !data ? <PageLoader /> : (() => {
        const { rows, totals } = data;
        const chart = rows.map((r) => ({ ...r, costs: r.expenses + r.payroll }));
        const margin = totals.revenue ? Math.round((totals.profit / totals.revenue) * 1000) / 10 : 0;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <StatCard icon={Wallet} label="Revenue" value={money(totals.revenue)} tone="brand" />
              <StatCard icon={PiggyBank} label="Expenses" value={money(totals.expenses)} tone="rose" />
              <StatCard icon={Banknote} label="Payroll" value={money(totals.payroll)} tone="sky" />
              <StatCard icon={totals.profit >= 0 ? TrendingUp : TrendingDown} label="Net profit" value={money(totals.profit)} hint={`${margin}% margin`} tone={totals.profit >= 0 ? 'emerald' : 'rose'} />
            </div>

            <Card>
              <CardHeader title="Revenue vs costs" subtitle="Costs = expenses + payroll" icon={Scale} />
              <div className="flex gap-4 px-5 pt-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: C_REV }} />Revenue</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: C_COST }} />Costs</span>
              </div>
              <div className="h-72 px-2 pb-4 sm:px-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} barGap={2}>
                    <CartesianGrid vertical={false} stroke="#eef2f6" />
                    <XAxis dataKey="month" tickFormatter={short} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={k} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={56} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} content={({ active, payload, label }) => active && payload?.length ? (
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
                        <p className="mb-1 font-semibold">{long(label)}</p>
                        <p className="text-slate-600">Revenue <b className="text-slate-900">{money(payload[0].payload.revenue)}</b></p>
                        <p className="text-slate-600">Expenses {money(payload[0].payload.expenses)} · Payroll {money(payload[0].payload.payroll)}</p>
                        <p className={payload[0].payload.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>Profit <b>{money(payload[0].payload.profit)}</b></p>
                      </div>
                    ) : null} />
                    <Bar dataKey="revenue" name="Revenue" fill={C_REV} radius={[4, 4, 0, 0]} maxBarSize={30} isAnimationActive={false} />
                    <Bar dataKey="costs" name="Costs" fill={C_COST} radius={[4, 4, 0, 0]} maxBarSize={30} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="Monthly statement" />
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Month</th><th className="text-right">Consultation</th><th className="text-right">Tests</th><th className="text-right">Revenue</th><th className="text-right">Expenses</th><th className="text-right">Payroll</th><th className="text-right">Net profit</th><th className="text-right">Margin</th></tr></thead>
                  <tbody>
                    {[...rows].reverse().map((r) => (
                      <tr key={r.month}>
                        <td className="whitespace-nowrap font-medium">{long(r.month)} {r.payrollStatus === 'Draft' && <Badge tone="amber">payroll draft</Badge>}</td>
                        <td className="text-right tabular-nums text-slate-600">{money(r.consultation)}</td>
                        <td className="text-right tabular-nums text-slate-600">{money(r.tests)}</td>
                        <td className="text-right font-semibold tabular-nums">{money(r.revenue)}</td>
                        <td className="text-right tabular-nums">{money(r.expenses)}</td>
                        <td className="text-right tabular-nums">{money(r.payroll)}</td>
                        <td className={cx('text-right font-semibold tabular-nums', r.profit >= 0 ? 'text-emerald-700' : 'text-rose-700')}>{r.profit < 0 ? `−${money(-r.profit)}` : money(r.profit)}</td>
                        <td className="text-right tabular-nums text-slate-500">{r.margin === null ? '—' : `${r.margin}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold">
                      <td className="px-4 py-3">Total</td><td /><td />
                      <td className="px-4 py-3 text-right tabular-nums">{money(totals.revenue)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{money(totals.expenses)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{money(totals.payroll)}</td>
                      <td className={cx('px-4 py-3 text-right tabular-nums', totals.profit >= 0 ? 'text-emerald-700' : 'text-rose-700')}>{money(totals.profit)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{margin}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">The current month is still in progress, and its payroll appears once it is generated on the Payroll page.</p>
            </Card>
          </div>
        );
      })()}
    </>
  );
}
