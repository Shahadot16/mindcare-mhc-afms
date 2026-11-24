import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn, Mail, Lock, ShieldCheck, Stethoscope, ClipboardList, User } from 'lucide-react';
import AuthShell from '@/components/layout/AuthShell';
import { Button, cx } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { errMsg } from '@/api/client';

const demo = [
  { role: 'Admin', email: 'admin@hospital.com', password: 'admin123', icon: ShieldCheck },
  { role: 'Doctor', email: 'doctor@hospital.com', password: 'doctor123', icon: Stethoscope },
  { role: 'Staff', email: 'staff@hospital.com', password: 'staff123', icon: ClipboardList },
  { role: 'Patient', email: 'patient@hospital.com', password: 'patient123', icon: User },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome back, ${u.fullName.split(' ')[0]}!`);
      navigate(location.state?.from || '/app', { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your MindCare account">
      {params.get('expired') && (
        <div className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">Your session expired. Please log in again.</div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="label">Email</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" type="email" required autoComplete="email" placeholder="you@example.com"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </label>
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <Link to="/forgot-password" className="text-xs font-semibold text-brand-600 hover:text-brand-700">Forgot password?</Link>
          </span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" type="password" required autoComplete="current-password" placeholder="••••••••"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
        </label>
        <Button type="submit" size="lg" className="w-full" loading={loading} icon={LogIn}>Log in</Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        New patient? <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">Create an account</Link>
      </p>

      <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Demo accounts: click to fill</p>
        <div className="grid grid-cols-2 gap-2">
          {demo.map(({ role, email, password, icon: Icon }) => (
            <button key={role} type="button" onClick={() => setForm({ email, password })}
              className={cx('flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-left text-sm transition cursor-pointer hover:border-brand-300 hover:shadow-sm',
                form.email === email ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200')}>
              <Icon className="size-4 text-brand-600" />
              <span className="font-semibold text-slate-700">{role}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
