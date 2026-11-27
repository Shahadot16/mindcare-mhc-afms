import { useState } from 'react';
import toast from 'react-hot-toast';
import { TestTubes, CheckCircle2 } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import useFetch from '@/hooks/useFetch';
import { Avatar, Button, Card, EmptyState, ErrorBox, Input, Modal, PageHeader, Spinner, StatusBadge, Tabs } from '@/components/ui';
import { fmtDate, money } from '@/utils/format';

export default function LabQueue() {
  const [tab, setTab] = useState('Accepted');
  const { data = [], loading, error, reload } = useFetch(`/appointments/lab-tests?status=${tab}`, []);
  const [completing, setCompleting] = useState(null);
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  const complete = async () => {
    setBusy(true);
    try {
      const { data: r } = await api.patch(`/appointments/${completing.appointmentId}/tests/${completing.testItemId}/complete`, { result });
      toast.success(r.message);
      setCompleting(null);
      reload({ silent: true });
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Lab queue" subtitle="Tests that patients accepted. Run them and record a short result." />
      <div className="mb-5">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'Accepted', label: 'To do' }, { value: 'Completed', label: 'Completed' }]} />
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      <Card>
        {loading ? <div className="grid place-items-center py-16"><Spinner /></div> : data.length === 0 ? (
          <EmptyState icon={TestTubes} title={tab === 'Accepted' ? 'Lab queue is empty' : 'No completed tests yet'} message="Tests show up here after a patient accepts a doctor's recommendation." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Test</th><th>Patient</th><th>Ordered by</th><th>Visit</th><th>Status</th><th className="text-right">{tab === 'Accepted' ? 'Action' : 'Result'}</th></tr></thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.testItemId}>
                    <td><p className="font-semibold">{r.testName}</p><p className="text-xs text-slate-500">{money(r.price)}</p></td>
                    <td><div className="flex items-center gap-2.5"><Avatar name={r.patient?.fullName} size="sm" /><span className="font-medium">{r.patient?.fullName}</span></div></td>
                    <td className="text-slate-600">{r.doctor?.fullName}</td>
                    <td className="whitespace-nowrap">{fmtDate(r.date)}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="text-right">
                      {tab === 'Accepted'
                        ? <Button size="sm" icon={CheckCircle2} onClick={() => { setCompleting(r); setResult(''); }}>Mark done</Button>
                        : <span className="text-sm text-slate-600">{r.result || '—'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={Boolean(completing)} onClose={() => setCompleting(null)} size="sm" title="Complete test"
        subtitle={completing && `${completing.testName} · ${completing.patient?.fullName}`}
        footer={<><Button variant="secondary" onClick={() => setCompleting(null)}>Cancel</Button><Button onClick={complete} loading={busy}>Mark completed</Button></>}>
        <Input label="Result summary (optional)" value={result} onChange={(e) => setResult(e.target.value)} placeholder="e.g. Within normal range" />
      </Modal>
    </>
  );
}
