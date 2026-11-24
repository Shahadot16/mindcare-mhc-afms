import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound } from 'lucide-react';
import api, { errMsg, tokenStore } from '@/api/client';
import AuthShell from '@/components/layout/AuthShell';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [pw, setPw] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.password !== pw.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password: pw.password });
      tokenStore.set(data.token);
      setUser(data.user);
      toast.success('Password updated. You are now logged in.');
      navigate('/app', { replace: true });
    } catch (err) { toast.error(errMsg(err)); } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Use at least 6 characters. A mix of words and numbers is easiest to remember.">
      <form onSubmit={submit} className="space-y-4">
        <Input label="New password" type="password" required minLength={6} autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} />
        <Input label="Confirm new password" type="password" required autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
        <Button type="submit" size="lg" className="w-full" loading={loading} icon={KeyRound}>Update password</Button>
      </form>
      <p className="mt-6 text-sm text-slate-500">Link expired? <Link to="/forgot-password" className="font-semibold text-brand-600">Request a new one</Link></p>
    </AuthShell>
  );
}
