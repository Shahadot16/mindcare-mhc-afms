import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Stethoscope } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import useFetch from '@/hooks/useFetch';
import { Avatar, Button, Modal, Textarea, cx } from '@/components/ui';
import { addDaysStr, fmtDate, fmtTime, money } from '@/utils/format';

/** Doctor writes diagnosis, prescription, follow-up and suggests tests. Completes the visit. */
export default function DiagnosisModal({ appointment: a, onClose, onSaved }) {
  const { data: tests = [] } = useFetch(a ? '/tests' : null, []);
  const [form, setForm] = useState({ diagnosis: '', prescription: '', followUpDate: '', testIds: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!a) return;
    setForm({
      diagnosis: a.diagnosis || '',
      prescription: a.prescription || '',
      followUpDate: a.followUpDate || '',
      testIds: (a.tests || []).map((t) => t.test),
    });
  }, [a]);

  if (!a) return null;
  const toggle = (id) => setForm((f) => ({ ...f, testIds: f.testIds.includes(id) ? f.testIds.filter((x) => x !== id) : [...f.testIds, id] }));
  const lockedIds = new Set((a.tests || []).filter((t) => t.status !== 'Suggested').map((t) => t.test));

  const save = async () => {
    if (!form.diagnosis.trim()) return toast.error('Please write a diagnosis');
    setSaving(true);
    try {
      const { data } = await api.patch(`/appointments/${a._id}/diagnosis`, form);
      toast.success(a.status === 'Completed' ? 'Visit notes updated' : 'Visit completed');
      onSaved(data);
    } catch (e) { toast.error(errMsg(e)); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} size="lg" title={a.status === 'Completed' ? 'Edit visit notes' : 'Complete visit'}
      subtitle={`${fmtDate(a.date)} · ${fmtTime(a.startTime)}`}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={save} loading={saving} icon={Stethoscope}>{a.status === 'Completed' ? 'Save changes' : 'Complete visit'}</Button>
      </>}>
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
        <Avatar name={a.patient.fullName} />
        <div className="flex-1">
          <p className="font-semibold">{a.patient.fullName}</p>
          <p className="text-xs text-slate-500">{[a.patient.age && `${a.patient.age} yrs`, a.patient.gender, a.patient.contactNumber].filter(Boolean).join(' · ') || 'No details'}</p>
        </div>
      </div>
      {a.description && <p className="mb-5 rounded-xl border-l-4 border-brand-300 bg-brand-50/50 px-4 py-2.5 text-sm text-slate-700"><b>Reason:</b> {a.description}</p>}

      <div className="space-y-4">
        <Textarea label="Diagnosis *" rows={2} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="Clinical impression…" />
        <Textarea label="Prescription" rows={4} value={form.prescription} onChange={(e) => setForm({ ...form, prescription: e.target.value })}
          placeholder={'One item per line, e.g.\nSertraline 50mg, 1 tablet after breakfast, 4 weeks\nDaily 20-minute walk'} hint="Each line appears as a separate ℞ item" />
        <div>
          <span className="label">Follow-up date</span>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" className="input max-w-50" min={addDaysStr(a.date, 1)} value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
            {[7, 14, 30].map((d) => (
              <Button key={d} type="button" size="sm" variant="secondary" onClick={() => setForm({ ...form, followUpDate: addDaysStr(a.date, d) })}>+{d} days</Button>
            ))}
            {form.followUpDate && <Button type="button" size="sm" variant="ghost" onClick={() => setForm({ ...form, followUpDate: '' })}>Clear</Button>}
          </div>
        </div>
        <div>
          <span className="label">Recommend tests</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {tests.map((t) => {
              const on = form.testIds.includes(t._id);
              const locked = lockedIds.has(t._id);
              return (
                <button key={t._id} type="button" disabled={locked} onClick={() => toggle(t._id)}
                  className={cx('flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition',
                    on ? 'border-brand-400 bg-brand-50' : 'border-slate-200 hover:border-slate-300', locked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer')}>
                  <span className={cx('grid size-5 shrink-0 place-items-center rounded-md border', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300')}>
                    {on && <Check className="size-3.5" />}
                  </span>
                  <span className="flex-1 font-medium">{t.testName}</span>
                  <span className="text-xs text-slate-500">{money(t.price)}</span>
                </button>
              );
            })}
          </div>
          {lockedIds.size > 0 && <p className="mt-1.5 text-xs text-slate-500">Tests the patient already responded to can't be removed.</p>}
        </div>
      </div>
    </Modal>
  );
}
