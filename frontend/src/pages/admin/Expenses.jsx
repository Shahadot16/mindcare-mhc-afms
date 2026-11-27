import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, PiggyBank, Download, Receipt } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import useFetch from '@/hooks/useFetch';
import { Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, ErrorBox, Input, Modal, PageHeader, PageLoader, Select, StatCard, Textarea } from '@/components/ui';
import { downloadCSV } from '@/utils/csv';
import { addDaysStr, fmtDate, money, todayStr } from '@/utils/format';

const empty = { title: '', category: 'Utilities', amount: '', date: todayStr(), note: '' };

export default function Expenses() {
  const today = todayStr();
  const [range, setRange] = useState({ start: `${today.slice(0, 7)}-01`, end: today });
  const [category, setCategory] = useState('');
  const { data, loading, error, reload } = useFetch(`/expenses?start=${range.start}&end=${range.end}${category ? `&category=${encodeURIComponent(category)}` : ''}`);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form._id) await api.put(`/expenses/${form._id}`, form);
      else await api.post('/expenses', form);
      toast.success(form._id ? 'Expense updated' : 'Expense recorded');
      setForm(null);
      reload({ silent: true });
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  };

  const remove = async () => {
    try {
      await api.delete(`/expenses/${deleting._id}`);
      toast.success('Expense deleted');
      setDeleting(null);
      reload({ silent: true });
    } catch (err) { toast.error(errMsg(err)); }
  };

  const presets = [
    ['This month', { start: `${today.slice(0, 7)}-01`, end: today }],
    ['Last 90 days', { start: addDaysStr(today, -89), end: today }],
    ['This year', { start: `${today.slice(0, 4)}-01-01`, end: today }],
  ];

  return (
    <>
      <PageHeader title="Expenses" subtitle="Rent, utilities, supplies and other running costs"
        action={<>
          {data?.items?.length > 0 && <Button variant="secondary" icon={Download} onClick={() => downloadCSV(`expenses_${range.start}_${range.end}.csv`, data.items, [
            { key: 'date', label: 'Date' }, { key: 'title', label: 'Title' }, { key: 'category', label: 'Category' }, { key: 'amount', label: 'Amount (BDT)' }, { key: 'note', label: 'Note' },
          ])}>Export CSV</Button>}
          <Button icon={Plus} onClick={() => setForm({ ...empty })}>Add expense</Button>
        </>} />

      <Card className="mb-6 flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
        <div className="flex flex-wrap gap-2">{presets.map(([l, r]) => <Button key={l} size="sm" variant="secondary" onClick={() => setRange(r)}>{l}</Button>)}</div>
        <div className="flex flex-wrap items-end gap-2 lg:ml-auto">
          <label><span className="label">From</span><input type="date" className="input" max={range.end} value={range.start} onChange={(e) => e.target.value && setRange({ ...range, start: e.target.value })} /></label>
          <label><span className="label">To</span><input type="date" className="input" min={range.start} max={today} value={range.end} onChange={(e) => e.target.value && setRange({ ...range, end: e.target.value })} /></label>
          <label><span className="label">Category</span>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All</option>{data?.categories?.map((c) => <option key={c}>{c}</option>)}
            </select></label>
        </div>
      </Card>

      {error ? <ErrorBox message={error} onRetry={reload} /> : loading || !data ? <PageLoader /> : (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader title="Transactions" subtitle={`${data.items.length} item${data.items.length === 1 ? '' : 's'}`} icon={Receipt} />
            {data.items.length === 0 ? <EmptyState icon={PiggyBank} title="No expenses in this range" /> : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Date</th><th>Expense</th><th>Category</th><th className="text-right">Amount</th><th /></tr></thead>
                  <tbody>
                    {data.items.map((x) => (
                      <tr key={x._id}>
                        <td className="whitespace-nowrap">{fmtDate(x.date)}</td>
                        <td><p className="font-medium">{x.title}</p>{x.note && <p className="text-xs text-slate-500">{x.note}</p>}</td>
                        <td><Badge>{x.category}</Badge></td>
                        <td className="text-right font-semibold tabular-nums">{money(x.amount)}</td>
                        <td>
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setForm({ ...x })} title="Edit" />
                            <Button size="sm" variant="dangerSoft" icon={Trash2} onClick={() => setDeleting(x)} title="Delete" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <div className="space-y-6">
            <StatCard icon={PiggyBank} label="Total spent" value={money(data.total)} hint={`${fmtDate(range.start, { day: 'numeric', month: 'short' })} – ${fmtDate(range.end, { day: 'numeric', month: 'short' })}`} tone="rose" />
            <Card>
              <CardHeader title="By category" />
              <div className="space-y-3.5 p-5 text-sm">
                {data.byCategory.length === 0 && <p className="text-slate-500">Nothing yet.</p>}
                {data.byCategory.map((c) => (
                  <div key={c.category}>
                    <div className="mb-1.5 flex justify-between"><span className="font-medium">{c.category}</span><b className="tabular-nums">{money(c.total)}</b></div>
                    <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-500" style={{ width: `${(c.total / data.byCategory[0].total) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      <Modal open={Boolean(form)} onClose={() => setForm(null)} title={form?._id ? 'Edit expense' : 'Add expense'}>
        {form && (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="sm:col-span-2" placeholder="e.g. Electricity bill" />
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {(data?.categories || []).map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Input label="Amount (৳)" type="number" min={1} required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input label="Date" type="date" max={today} required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Textarea label="Note" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="sm:col-span-2" />
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit" loading={saving}>{form._id ? 'Save' : 'Add expense'}</Button>
            </div>
          </form>
        )}
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove} danger confirmText="Delete"
        title="Delete this expense?" message={deleting && `${deleting.title} · ${money(deleting.amount)} on ${fmtDate(deleting.date)}`} />
    </>
  );
}
