import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Receipt, FilePlus2, FileText, BadgePercent, Clock4 } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import useFetch from '@/hooks/useFetch';
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, ErrorBox, PageHeader, PageLoader, StatusBadge, Tabs } from '@/components/ui';
import { fmtDate, money } from '@/utils/format';

export default function Billing() {
  const [tab, setTab] = useState('unbilled');
  return (
    <>
      <PageHeader title="Billing" subtitle="Generate invoices for completed visits and track payments" />
      <div className="mb-5">
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: 'unbilled', label: 'Ready to bill' },
          { value: 'Unpaid', label: 'Unpaid invoices' },
          { value: 'Paid', label: 'Paid invoices' },
        ]} />
      </div>
      {tab === 'unbilled' ? <Unbilled /> : <InvoiceList status={tab} />}
    </>
  );
}

function Unbilled() {
  const { data = [], loading, error, reload } = useFetch('/billing/unbilled', []);
  const [busy, setBusy] = useState(null);

  const generate = async (appointmentId) => {
    setBusy(appointmentId);
    try {
      const { data: inv } = await api.post('/billing/invoices', { appointmentId });
      toast.success(`${inv.invoiceNo} created: ${money(inv.amount)}`);
      reload({ silent: true });
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data.length) return <Card><EmptyState icon={Receipt} title="Nothing to bill" message="Completed visits without an invoice will appear here." /></Card>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.map(({ appointment: a, preview: p }) => (
        <Card key={a._id} className="flex flex-col">
          <CardHeader title={a.patient.fullName} subtitle={`${a.doctor.fullName} · ${fmtDate(a.date)}`}
            action={p.isFollowUp && <Badge tone="emerald"><BadgePercent className="size-3.5" />Follow-up</Badge>} />
          <div className="flex-1 p-5">
            <ul className="space-y-2 text-sm">
              {p.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="text-slate-600">{it.label}</span>
                  <span className={it.amount < 0 ? 'text-emerald-600' : 'tabular-nums'}>{it.amount < 0 ? `−${money(-it.amount)}` : money(it.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-display text-lg font-extrabold"><span>Total</span><span>{money(p.amount)}</span></div>
            {p.pendingTests > 0 && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock4 className="mt-0.5 size-3.5 shrink-0" />
                {p.pendingTests} suggested test{p.pendingTests > 1 ? 's are' : ' is'} still awaiting the patient's reply and won't be billed if you invoice now.
              </p>
            )}
          </div>
          <div className="border-t border-slate-100 px-5 py-4">
            <Button className="w-full" icon={FilePlus2} loading={busy === a._id} onClick={() => generate(a._id)}>Generate invoice</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function InvoiceList({ status }) {
  const { data = [], loading, error, reload } = useFetch(`/billing/invoices?status=${status}`, []);
  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const total = data.reduce((s, i) => s + i.amount, 0);

  return (
    <Card>
      <CardHeader title={`${status} invoices`} subtitle={`${data.length} invoice${data.length === 1 ? '' : 's'} · ${money(total)}`} icon={Receipt} />
      {!data.length ? <EmptyState icon={Receipt} title={`No ${status.toLowerCase()} invoices`} /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Invoice</th><th>Patient</th><th>Doctor</th><th>{status === 'Paid' ? 'Paid on' : 'Due'}</th><th>Amount</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.map((inv) => (
                <tr key={inv._id}>
                  <td className="font-mono text-xs">{inv.invoiceNo}</td>
                  <td><div className="flex items-center gap-2.5"><Avatar name={inv.patient?.fullName} size="sm" /><span className="font-medium">{inv.patient?.fullName}</span></div></td>
                  <td className="text-slate-600">{inv.doctor?.fullName}</td>
                  <td className="whitespace-nowrap">{status === 'Paid' ? fmtDate(inv.paidAt) : fmtDate(inv.dueDate)}</td>
                  <td className="font-semibold tabular-nums">{money(inv.amount)}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td className="text-right"><Link to={`/app/invoices/${inv._id}`}><Button size="sm" variant="secondary" icon={FileText}>View</Button></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
