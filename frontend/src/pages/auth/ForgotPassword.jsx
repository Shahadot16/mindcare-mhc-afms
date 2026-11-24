import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Send, ArrowLeft, MailCheck } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import AuthShell from '@/components/layout/AuthShell';
import { Button } from '@/components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSent(data);
    } catch (err) { toast.error(errMsg(err)); } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll send you a link to reset it.">
      {sent ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <MailCheck className="size-8 text-emerald-600" />
          <p className="mt-3 font-semibold">Check your inbox</p>
          <p className="mt-1">{sent.message} The link expires in 30 minutes.</p>
          {sent.devResetUrl && (
            <div className="mt-4 rounded-xl bg-white p-3 text-xs text-slate-600 ring-1 ring-emerald-200">
              <p className="font-semibold text-slate-800">Development mode (no email server configured)</p>
              <Link to={new URL(sent.devResetUrl).pathname} className="mt-1 block break-all font-medium text-brand-600 hover:underline">Open the reset link →</Link>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="label">Email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </label>
          <Button type="submit" size="lg" className="w-full" loading={loading} icon={Send}>Send reset link</Button>
        </form>
      )}
      <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft className="size-4" />Back to login</Link>
    </AuthShell>
  );
}
