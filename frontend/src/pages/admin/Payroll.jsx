import { useState } from 'react';
import toast from 'react-hot-toast';
import { Banknote, Calculator, CheckCircle2, Download, Lock, Users } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import useFetch from '@/hooks/useFetch';
import { Avatar, Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, ErrorBox, PageHeader, PageLoader, StatCard, StatusBadge } from '@/components/ui';
import { downloadCSV } from '@/utils/csv';
import { money, todayStr } from '@/utils/format';

const monthLabel = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

export default function Payroll() {
  const [month, setMonth] = useState(todayStr().slice(0, 7));
  const runs = useFetch('/payroll', []);
  const { data, loading, error, reload } = useFetch(`/payroll/preview?month=${month}`);
  const [busy, setBusy] = useState(false);
  const [confirmPay, setConfirmPay] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      await api.post('/payroll', { month });
      toast.success(`Payroll for ${monthLabel(month)} saved as draft`);
      reload({ silent: true }); runs.reload({ silent: true });
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const pay = async () => {
    setBusy(true);
    try {
      await api.patch(`/payroll/${data._id}/pay`);
      toast.success('Payroll marked as paid. Employees were notified.');
      setConfirmPay(false);
      reload({ silent: true }); runs.reload({ silent: true });
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const status = data?.status;
  const commissionTotal = data?.entries?.reduce((s, e) => s + e.commission, 0) || 0;

  return (
    <>
      <PageHeader title="Payroll" subtitle="Monthly salaries plus doctor commission on paid consultations"
        action={<input type="month" className="input w-auto" max={todayStr().slice(0, 7)} value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />} />

      {error ? <ErrorBox message={error} onRetry={reload} /> : loading || !data ? <PageLoader /> : (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              <StatCard icon={Banknote} label={`Total for ${monthLabel(month)}`} value={money(data.total)} tone="brand" />
              <StatCard icon={Calculator} label="Doctor commission" value={money(commissionTotal)} hint="Included in total" tone="sky" />
              <StatCard icon={Users} label="Employees" value={data.entries.length} tone="sky" />
            </div>
            <Card>
              <CardHeader title={monthLabel(month)} subtitle={status === 'Preview' ? 'Preview, not saved yet' : status === 'Draft' ? 'Draft, can be recalculated' : 'Paid and locked'} icon={Banknote}
                action={<div className="flex flex-wrap gap-2">
                  {data.entries.length > 0 && <Button size="sm" variant="secondary" icon={Download} onClick={() => downloadCSV(`payroll_${month}.csv`, data.entries, [
                    { key: 'name', label: 'Employee' }, { key: 'role', label: 'Role' }, { key: 'baseSalary', label: 'Base salary' },
                    { key: 'commissionRate', label: 'Commission %' }, { key: 'commissionBase', label: 'Consultation revenue' }, { key: 'commission', label: 'Commission' }, { key: 'total', label: 'Total' },
                  ])}>CSV</Button>}
                  {status !== 'Paid' && <Button size="sm" variant="soft" icon={Calculator} loading={busy && status !== 'Draft'} onClick={generate}>{status === 'Draft' ? 'Recalculate' : 'Save draft'}</Button>}
                  {status === 'Draft' && <Button size="sm" icon={CheckCircle2} onClick={() => setConfirmPay(true)}>Mark as paid</Button>}
                  {status === 'Paid' && <Badge tone="emerald"><Lock className="size-3" />Paid</Badge>}
                </div>} />
              {data.entries.length === 0 ? <EmptyState icon={Users} title="No active employees" /> : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Employee</th><th className="text-right">Base</th><th className="text-right">Consultation revenue</th><th className="text-right">Commission</th><th className="text-right">Total</th></tr></thead>
                    <tbody>
                      {data.entries.map((e) => (
                        <tr key={String(e.user)}>
                          <td><div className="flex items-center gap-3"><Avatar name={e.name} size="sm" /><div><p className="font-medium">{e.name}</p><p className="text-xs text-slate-500">{e.role}{e.commissionRate ? ` · ${e.commissionRate}% commission` : ''}</p></div></div></td>
                          <td className="text-right tabular-nums">{money(e.baseSalary)}</td>
                          <td className="text-right tabular-nums text-slate-500">{e.role === 'Doctor' ? money(e.commissionBase) : '—'}</td>
                          <td className="text-right tabular-nums">{e.commission ? money(e.commission) : '—'}</td>
                          <td className="text-right font-semibold tabular-nums">{money(e.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr><td className="px-4 py-3 font-bold">Total</td><td colSpan={3} /><td className="px-4 py-3 text-right font-display text-lg font-bold tabular-nums">{money(data.total)}</td></tr></tfoot>
                  </table>
                </div>
              )}
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader title="Payroll history" />
            <ul className="divide-y divide-slate-100">
              {(runs.data || []).length === 0 && <li className="p-5 text-sm text-slate-500">No payroll runs yet.</li>}
              {(runs.data || []).map((r) => (
                <li key={r._id}>
                  <button onClick={() => setMonth(r.month)} className={`flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition hover:bg-slate-50 cursor-pointer ${r.month === month ? 'bg-brand-50/60' : ''}`}>
                    <span><span className="block text-sm font-semibold">{monthLabel(r.month)}</span><span className="text-xs text-slate-500">{money(r.total)}</span></span>
                    <StatusBadge status={r.status === 'Paid' ? 'Paid' : 'Pending'} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <ConfirmDialog open={confirmPay} onClose={() => setConfirmPay(false)} onConfirm={pay} loading={busy} confirmText="Mark as paid"
        title={`Pay ${monthLabel(month)} payroll?`} message={`${money(data?.total)} to ${data?.entries?.length} employees. The run will be locked and each employee notified.`} />
    </>
  );
}
