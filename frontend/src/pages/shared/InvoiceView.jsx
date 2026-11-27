import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, CreditCard, CheckCircle2 } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, ErrorBox, PageLoader, StatusBadge } from '@/components/ui';
import { fmtDate, fmtTime, money } from '@/utils/format';

/** Printable invoice / payment receipt. */
export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(`/billing/invoices/${id}`);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { invoice: inv, payment } = data;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)}>Back</Button>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
          {user.role === 'Patient' && inv.status === 'Unpaid' && (
            <Link to={`/app/bills/${inv._id}/pay`}><Button icon={CreditCard}>Pay {money(inv.amount)}</Button></Link>
          )}
        </div>
      </div>

      <Card className="p-6 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-600 font-display text-xl font-bold text-white" aria-hidden>M</span>
            <div><p className="font-display text-lg font-bold">MindCare Clinic</p><p className="text-xs text-slate-500">Mental Health Care AFMS</p></div>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold">{inv.status === 'Paid' ? 'Receipt' : 'Invoice'}</p>
            <p className="font-mono text-sm text-slate-500">{inv.invoiceNo}</p>
            <div className="mt-2"><StatusBadge status={inv.status} /></div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 rounded-2xl bg-slate-50 p-5 text-sm sm:grid-cols-3">
          <div><p className="text-xs font-semibold uppercase text-slate-400">Billed to</p><p className="mt-1 font-semibold">{inv.patient.fullName}</p><p className="text-slate-500">{inv.patient.email}</p></div>
          <div><p className="text-xs font-semibold uppercase text-slate-400">Doctor</p><p className="mt-1 font-semibold">{inv.doctor.fullName}</p><p className="text-slate-500">{inv.doctor.specialization}</p></div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Visit</p>
            <p className="mt-1 font-semibold">{fmtDate(inv.appointment?.date)}</p>
            <p className="text-slate-500">{fmtTime(inv.appointment?.startTime)} · Due {fmtDate(inv.dueDate)}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead><tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400"><th className="pb-2 font-semibold">Description</th><th className="pb-2 font-semibold">Type</th><th className="pb-2 text-right font-semibold">Amount</th></tr></thead>
          <tbody>
            {inv.items.map((it, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-3">{it.label}</td>
                <td className="py-3 text-slate-500">{it.type}</td>
                <td className={`py-3 text-right tabular-nums ${it.amount < 0 ? 'text-emerald-600' : ''}`}>{it.amount < 0 ? `− ${money(-it.amount)}` : money(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ml-auto mt-4 max-w-xs space-y-2 text-sm">
          {inv.discount > 0 && <div className="flex justify-between text-emerald-600"><span>You saved</span><span>{money(inv.discount)}</span></div>}
          <div className="flex justify-between border-t border-slate-200 pt-3 font-display text-lg font-bold"><span>Total</span><span>{money(inv.amount)}</span></div>
        </div>

        {payment && (
          <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
            <CheckCircle2 className="size-6 text-emerald-600" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-800">Paid via {payment.method} ({payment.accountRef})</p>
              <p className="text-emerald-700">{new Date(payment.createdAt).toLocaleString('en-GB')} · Txn <span className="font-mono">{payment.transactionId}</span></p>
            </div>
          </div>
        )}
        <p className="mt-8 text-center text-xs text-slate-400">This is a computer-generated document from an academic system. Payments are simulated; no real money is charged.</p>
      </Card>
    </div>
  );
}
