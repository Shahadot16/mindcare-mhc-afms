import { Link } from 'react-router-dom';
import { Receipt, CreditCard, FileText, Wallet, CheckCircle2 } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { Button, Card, CardHeader, EmptyState, ErrorBox, PageHeader, PageLoader, StatCard, StatusBadge } from '@/components/ui';
import { fmtDate, money } from '@/utils/format';

export default function MyBills() {
  const { data = [], loading, error, reload } = useFetch('/billing/invoices/mine', []);
  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const unpaid = data.filter((i) => i.status === 'Unpaid');
  const paidTotal = data.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
  const dueTotal = unpaid.reduce((s, i) => s + i.amount, 0);
  const saved = data.reduce((s, i) => s + (i.discount || 0), 0);

  return (
    <>
      <PageHeader title="My bills" subtitle="Invoices for your visits and tests" />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard icon={Wallet} label="Amount due" value={money(dueTotal)} hint={`${unpaid.length} unpaid`} tone="amber" />
        <StatCard icon={CheckCircle2} label="Total paid" value={money(paidTotal)} tone="emerald" />
        <StatCard icon={Receipt} label="Saved with follow-up discount" value={money(saved)} tone="blue" />
      </div>

      <Card>
        <CardHeader title="All invoices" icon={Receipt} />
        {data.length === 0 ? <EmptyState icon={Receipt} title="No bills yet" message="Invoices appear here once staff bill a completed visit." /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Invoice</th><th>Doctor</th><th>Visit date</th><th>Amount</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {data.map((inv) => (
                  <tr key={inv._id}>
                    <td className="font-mono text-xs">{inv.invoiceNo}</td>
                    <td><p className="font-medium">{inv.doctor.fullName}</p><p className="text-xs text-slate-500">{inv.doctor.specialization}</p></td>
                    <td className="whitespace-nowrap">{fmtDate(inv.appointment?.date)}</td>
                    <td className="font-semibold tabular-nums">{money(inv.amount)}{inv.discount > 0 && <span className="ml-1.5 text-xs font-medium text-emerald-600">−40%</span>}</td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Link to={`/app/invoices/${inv._id}`}><Button size="sm" variant="secondary" icon={FileText}>{inv.status === 'Paid' ? 'Receipt' : 'View'}</Button></Link>
                        {inv.status === 'Unpaid' && <Link to={`/app/bills/${inv._id}/pay`}><Button size="sm" icon={CreditCard}>Pay</Button></Link>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
