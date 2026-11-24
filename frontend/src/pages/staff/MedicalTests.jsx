import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, FlaskConical, Power } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import useFetch from '@/hooks/useFetch';
import { Button, Card, EmptyState, ErrorBox, Input, Modal, PageHeader, PageLoader, StatusBadge, Textarea } from '@/components/ui';
import { money } from '@/utils/format';

const empty = { testName: '', price: '', description: '' };

export default function MedicalTests() {
  const { data = [], loading, error, reload } = useFetch('/tests?all=true', []);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...test} = edit
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const open = (t) => { setEditing(t || {}); setForm(t ? { testName: t.testName, price: t.price, description: t.description } : empty); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing._id) await api.put(`/tests/${editing._id}`, form);
      else await api.post('/tests', form);
      toast.success(editing._id ? 'Test updated' : 'Test added');
      setEditing(null);
      reload({ silent: true });
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  };

  const toggle = async (t) => {
    try {
      await api.put(`/tests/${t._id}`, { isActive: !t.isActive });
      toast.success(`${t.testName} ${t.isActive ? 'deactivated' : 'activated'}`);
      reload({ silent: true });
    } catch (err) { toast.error(errMsg(err)); }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Medical tests" subtitle="The catalogue of tests doctors can recommend, with their prices"
        action={<Button icon={Plus} onClick={() => open()}>Add test</Button>} />

      {data.length === 0 ? <Card><EmptyState icon={FlaskConical} title="No tests yet" action={<Button size="sm" icon={Plus} onClick={() => open()}>Add the first test</Button>} /></Card> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((t) => (
            <Card key={t._id} className={`flex flex-col p-5 ${t.isActive ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-violet-50 text-violet-600"><FlaskConical className="size-5" /></span>
                <StatusBadge status={t.isActive ? 'Active' : 'Inactive'} />
              </div>
              <h3 className="mt-4 font-bold">{t.testName}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-500">{t.description || 'No description'}</p>
              <div className="mt-4 flex items-center justify-between">
                <p className="font-display text-xl font-extrabold">{money(t.price)}</p>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="secondary" icon={Pencil} onClick={() => open(t)}>Edit</Button>
                  <Button size="sm" variant={t.isActive ? 'dangerSoft' : 'soft'} icon={Power} onClick={() => toggle(t)} title={t.isActive ? 'Deactivate' : 'Activate'} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} size="sm" title={editing?._id ? 'Edit test' : 'Add test'}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Test name" required value={form.testName} onChange={(e) => setForm({ ...form, testName: e.target.value })} />
          <Input label="Price (৳)" type="number" min={0} required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Textarea label="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing?._id ? 'Save' : 'Add test'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
