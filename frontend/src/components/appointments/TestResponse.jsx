import { useState } from 'react';
import toast from 'react-hot-toast';
import { Check, X, FlaskConical } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import { Button, StatusBadge } from '@/components/ui';
import { money } from '@/utils/format';

/** List of suggested tests on an appointment. Patients can accept or decline the ones still open. */
export default function TestResponse({ appointment, canRespond, onChange }) {
  const [busy, setBusy] = useState(null);
  if (!appointment.tests?.length) return null;

  const respond = async (testItemId, action) => {
    setBusy(testItemId + action);
    try {
      const { data } = await api.patch(`/appointments/${appointment._id}/tests/${testItemId}`, { action });
      toast.success(action === 'accept' ? 'Test accepted. Our lab staff will contact you.' : 'Test declined');
      onChange?.(data);
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(null); }
  };

  const open = canRespond && !appointment.isInvoiceGenerated;
  return (
    <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
      {appointment.tests.map((t) => (
        <li key={t._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <span className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-600"><FlaskConical className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t.testName}</p>
            <p className="text-xs text-slate-500">{money(t.price)}{t.result ? ` · Result: ${t.result}` : ''}</p>
          </div>
          {open && ['Suggested', 'Accepted', 'Rejected'].includes(t.status) ? (
            <div className="flex items-center gap-2">
              {t.status !== 'Suggested' && <StatusBadge status={t.status} />}
              {t.status !== 'Accepted' && <Button size="sm" variant="soft" icon={Check} loading={busy === t._id + 'accept'} onClick={() => respond(t._id, 'accept')}>Accept</Button>}
              {t.status !== 'Rejected' && <Button size="sm" variant="dangerSoft" icon={X} loading={busy === t._id + 'reject'} onClick={() => respond(t._id, 'reject')}>Decline</Button>}
            </div>
          ) : <StatusBadge status={t.status} />}
        </li>
      ))}
    </ul>
  );
}
