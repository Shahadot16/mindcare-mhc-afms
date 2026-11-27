import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CreditCard, Smartphone, Lock, ShieldCheck, CheckCircle2, Receipt } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import useFetch from '@/hooks/useFetch';
import { Button, Card, CardHeader, ErrorBox, Input, PageLoader, cx } from '@/components/ui';
import { fmtDate, money } from '@/utils/format';

const wallets = [
  { id: 'bKash', color: '#e2136e', bg: 'bg-rose-50', ring: 'ring-rose-300' },
  { id: 'Nagad', color: '#ec1c24', bg: 'bg-orange-50', ring: 'ring-orange-300' },
  { id: 'Rocket', color: '#8c3494', bg: 'bg-blue-50', ring: 'ring-blue-300' },
];

const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

export default function PayBill() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useFetch(`/billing/invoices/${id}`);
  const [mode, setMode] = useState('Card');
  const [wallet, setWallet] = useState('bKash');
  const [card, setCard] = useState({ cardNumber: '', cardName: '', expiry: '', cvv: '' });
  const [mfs, setMfs] = useState({ walletNumber: '', pin: '' });
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(null);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} />;
  const inv = data.invoice;

  if (inv.status === 'Paid' && !done) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
        <h2 className="mt-3 text-xl font-bold">This bill is already paid</h2>
        <Link to={`/app/invoices/${inv._id}`}><Button className="mt-5" icon={Receipt}>View receipt</Button></Link>
      </Card>
    );
  }

  const pay = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      const body = mode === 'Card'
        ? { method: 'Card', ...card, cardNumber: card.cardNumber.replace(/\s/g, '') }
        : { method: wallet, ...mfs };
      // Short pause so the "processing" state is visible, like a real gateway
      await new Promise((r) => setTimeout(r, 900));
      const { data: res } = await api.post('/billing/pay', { invoiceId: inv._id, ...body });
      setDone(res.payment);
      toast.success('Payment successful');
    } catch (err) { toast.error(errMsg(err)); } finally { setPaying(false); }
  };

  if (done) {
    return (
      <Card className="mx-auto max-w-md overflow-hidden text-center">
        <div className="bg-brand-700 px-8 py-10 text-white">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-white/20 animate-pop"><CheckCircle2 className="size-9" /></span>
          <h2 className="mt-4 text-2xl font-bold text-white">Payment successful</h2>
          <p className="mt-1 font-display text-3xl font-bold">{money(done.amount)}</p>
        </div>
        <dl className="space-y-3 p-6 text-left text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Method</dt><dd className="font-semibold">{done.method}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Account</dt><dd className="font-mono">{done.accountRef}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Transaction ID</dt><dd className="font-mono">{done.transactionId}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Invoice</dt><dd className="font-mono">{inv.invoiceNo}</dd></div>
        </dl>
        <div className="flex gap-2 px-6 pb-6">
          <Button variant="secondary" className="flex-1" onClick={() => navigate('/app/bills')}>My bills</Button>
          <Link to={`/app/invoices/${inv._id}`} className="flex-1"><Button className="w-full" icon={Receipt}>Receipt</Button></Link>
        </div>
      </Card>
    );
  }

  const active = wallets.find((w) => w.id === wallet);

  return (
    <>
      <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)} className="mb-4">Back</Button>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader title="Secure payment" subtitle="Simulated gateway: no real money is charged" icon={Lock} />
          <div className="p-5">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
              {[['Card', CreditCard, 'Card payment'], ['Mobile', Smartphone, 'Mobile banking']].map(([m, Icon, label]) => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={cx('flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition cursor-pointer',
                    mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                  <Icon className="size-4" />{label}
                </button>
              ))}
            </div>

            <form onSubmit={pay} className="mt-6 space-y-4">
              {mode === 'Card' ? (<>
                <div className="relative h-44 overflow-hidden rounded-2xl bg-linear-to-br from-slate-800 via-slate-900 to-brand-900 p-5 text-white shadow-xl">
                  <div className="absolute -right-10 -top-10 size-40 rounded-full bg-brand-500/30 blur-2xl" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex justify-between"><span className="h-8 w-11 rounded-md bg-linear-to-br from-amber-200 to-amber-400" /><span className="font-display text-sm font-bold italic">MindCare Pay</span></div>
                    <p className="font-mono text-lg tracking-[0.15em]">{card.cardNumber || '•••• •••• •••• ••••'}</p>
                    <div className="flex justify-between text-xs uppercase"><span className="truncate">{card.cardName || 'Card holder'}</span><span>{card.expiry || 'MM/YY'}</span></div>
                  </div>
                </div>
                <Input label="Card number" inputMode="numeric" required placeholder="4242 4242 4242 4242" value={card.cardNumber}
                  onChange={(e) => setCard({ ...card, cardNumber: formatCard(e.target.value) })} />
                <Input label="Name on card" required value={card.cardName} onChange={(e) => setCard({ ...card, cardName: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Expiry" required placeholder="MM/YY" inputMode="numeric" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} />
                  <Input label="CVV" required type="password" inputMode="numeric" maxLength={4} placeholder="•••" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })} />
                </div>
              </>) : (<>
                <div className="grid grid-cols-3 gap-3">
                  {wallets.map((w) => (
                    <button key={w.id} type="button" onClick={() => setWallet(w.id)}
                      className={cx('rounded-2xl border-2 py-4 font-display text-lg font-bold transition cursor-pointer',
                        wallet === w.id ? `${w.bg} border-transparent ring-2 ${w.ring}` : 'border-slate-200 bg-white hover:border-slate-300')}
                      style={{ color: w.color }}>
                      {w.id}
                    </button>
                  ))}
                </div>
                <Input label={`${wallet} account number`} required inputMode="numeric" placeholder="01XXXXXXXXX" maxLength={11}
                  value={mfs.walletNumber} onChange={(e) => setMfs({ ...mfs, walletNumber: e.target.value.replace(/\D/g, '') })} />
                <Input label="PIN" required type="password" inputMode="numeric" maxLength={5} placeholder="•••••"
                  value={mfs.pin} onChange={(e) => setMfs({ ...mfs, pin: e.target.value.replace(/\D/g, '') })} />
              </>)}
              <Button type="submit" size="lg" className="w-full" loading={paying}
                style={mode === 'Mobile' ? { backgroundColor: active.color } : undefined}>
                {paying ? 'Processing…' : `Pay ${money(inv.amount)}${mode === 'Mobile' ? ` with ${wallet}` : ''}`}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500"><ShieldCheck className="size-3.5" />Only a masked reference is stored. Card and PIN are never saved.</p>
            </form>
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Order summary" icon={Receipt} />
          <div className="p-5 text-sm">
            <p className="font-mono text-xs text-slate-500">{inv.invoiceNo}</p>
            <p className="mt-1 font-semibold">{inv.doctor.fullName}</p>
            <p className="text-slate-500">Visit on {fmtDate(inv.appointment?.date)}</p>
            <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              {inv.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="text-slate-600">{it.label}</span>
                  <span className={cx('tabular-nums', it.amount < 0 && 'text-emerald-600')}>{it.amount < 0 ? `−${money(-it.amount)}` : money(it.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 font-display text-xl font-bold"><span>Total</span><span>{money(inv.amount)}</span></div>
          </div>
        </Card>
      </div>
    </>
  );
}
