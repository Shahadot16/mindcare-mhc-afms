import { useState } from 'react';
import toast from 'react-hot-toast';
import { Save, KeyRound, Mail, Phone, MapPin, BadgeCheck } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Avatar, Badge, Button, Card, CardHeader, Input, PageHeader, Select, Textarea } from '@/components/ui';
import { fmtDate, fmtHour, money } from '@/utils/format';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user.fullName, contactNumber: user.contactNumber || '', age: user.age ?? '', gender: user.gender || '',
    address: user.address || '', bio: user.bio || '',
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { ...form, age: form.age === '' ? undefined : Number(form.age) });
      setUser(data.user);
      toast.success('Profile updated');
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error('New passwords do not match');
    setSavingPw(true);
    try {
      await api.put('/auth/profile', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed');
    } catch (err) { toast.error(errMsg(err)); } finally { setSavingPw(false); }
  };

  return (
    <>
      <PageHeader title="Profile settings" subtitle="Manage your personal information and password" />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit overflow-hidden">
          <div className="h-24 bg-brand-700" />
          <div className="-mt-10 px-6 pb-6 text-center">
            <Avatar name={user.fullName} size="xl" className="mx-auto ring-4 ring-white" />
            <h2 className="mt-3 text-lg font-bold">{user.fullName}</h2>
            <Badge tone="brand" className="mt-1.5"><BadgeCheck className="size-3.5" />{user.role}</Badge>
            <div className="mt-5 space-y-2.5 text-left text-sm text-slate-600">
              <p className="flex items-center gap-2.5"><Mail className="size-4 text-slate-400" />{user.email}</p>
              {user.contactNumber && <p className="flex items-center gap-2.5"><Phone className="size-4 text-slate-400" />{user.contactNumber}</p>}
              {user.address && <p className="flex items-center gap-2.5"><MapPin className="size-4 text-slate-400" />{user.address}</p>}
            </div>
            {user.role === 'Doctor' && (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left text-sm">
                <p className="font-semibold">{user.specialization}</p>
                <p className="text-slate-500">Fee: {money(user.consultationFee)}</p>
                {user.schedule?.days?.length > 0 && (
                  <p className="mt-1 text-slate-500">{user.schedule.days.map((d) => d.slice(0, 3)).join(', ')} · {fmtHour(user.schedule.startHour)}–{fmtHour(user.schedule.endHour)}</p>
                )}
              </div>
            )}
            <p className="mt-5 text-xs text-slate-400">Member since {fmtDate(user.createdAt, { month: 'long', year: 'numeric' })}</p>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Personal information" subtitle="This is shown to the clinic team" />
            <form onSubmit={save} className="grid gap-4 p-5 sm:grid-cols-2">
              <Input label="Full name" required value={form.fullName} onChange={set('fullName')} className="sm:col-span-2" />
              <Input label="Phone" value={form.contactNumber} onChange={set('contactNumber')} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Age" type="number" min={0} max={130} value={form.age} onChange={set('age')} />
                <Select label="Gender" value={form.gender} onChange={set('gender')}>
                  <option value="">—</option><option>Male</option><option>Female</option><option>Other</option>
                </Select>
              </div>
              <Textarea label="Address" rows={2} value={form.address} onChange={set('address')} className="sm:col-span-2" />
              {user.role === 'Doctor' && <Textarea label="Bio (shown to patients)" rows={3} value={form.bio} onChange={set('bio')} className="sm:col-span-2" />}
              <div className="sm:col-span-2"><Button type="submit" loading={saving} icon={Save}>Save changes</Button></div>
            </form>
          </Card>

          <Card>
            <CardHeader title="Change password" icon={KeyRound} />
            <form onSubmit={changePassword} className="grid gap-4 p-5 sm:grid-cols-3">
              <Input label="Current password" type="password" required autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
              <Input label="New password" type="password" required minLength={6} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
              <Input label="Confirm new password" type="password" required autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
              <div className="sm:col-span-3"><Button type="submit" variant="secondary" loading={savingPw}>Update password</Button></div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
