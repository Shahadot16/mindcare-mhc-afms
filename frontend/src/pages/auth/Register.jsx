import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import AuthShell from '@/components/layout/AuthShell';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { errMsg } from '@/api/client';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', age: '', gender: '', contactNumber: '', address: '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created. Welcome to MindCare!');
      navigate('/app', { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Register as a patient to book appointments and manage your care">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Full name" required value={form.fullName} onChange={set('fullName')} placeholder="e.g. Rahim Uddin" />
        <Input label="Email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Password" type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={set('password')} hint="At least 6 characters" />
          <Input label="Confirm password" type="password" required autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Age" type="number" min={0} max={130} value={form.age} onChange={set('age')} />
          <Select label="Gender" value={form.gender} onChange={set('gender')}>
            <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
          </Select>
          <Input label="Phone" value={form.contactNumber} onChange={set('contactNumber')} placeholder="01XXXXXXXXX" />
        </div>
        <Textarea label="Address" rows={2} value={form.address} onChange={set('address')} placeholder="Area, City" />
        <p className="text-sm text-slate-500">By creating an account you agree to our <Link to="/terms" className="font-semibold text-brand-700 hover:underline">terms</Link> and <Link to="/privacy" className="font-semibold text-brand-700 hover:underline">privacy policy</Link>.</p>
        <Button type="submit" size="lg" className="w-full" loading={loading} icon={UserPlus}>Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Log in</Link>
      </p>
    </AuthShell>
  );
}
