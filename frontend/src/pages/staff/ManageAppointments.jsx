import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, X, Search, CalendarDays, FileText } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import useFetch from '@/hooks/useFetch';
import { Avatar, Button, Card, ConfirmDialog, EmptyState, ErrorBox, PageHeader, PageLoader, StatusBadge, Tabs } from '@/components/ui';
import { fmtDate, fmtTime, money } from '@/utils/format';
import { ModeBadge } from '@/components/appointments/VideoCall';

export default function ManageAppointments() {
  const { data = [], setData, loading, error, reload } = useFetch('/appointments', []);
  const [tab, setTab] = useState('Pending');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const counts = useMemo(() => data.reduce((m, a) => ({ ...m, [a.status]: (m[a.status] || 0) + 1 }), {}), [data]);
  const list = useMemo(() => {
    const s = search.toLowerCase();
    return data
      .filter((a) => tab === 'All' || a.status === tab)
      .filter((a) => !date || a.date === date)
      .filter((a) => !s || a.patient?.fullName.toLowerCase().includes(s) || a.doctor?.fullName.toLowerCase().includes(s))
      .sort((x, y) => (tab === 'Pending' ? 1 : -1) * (x.date + x.startTime).localeCompare(y.date + y.startTime));
  }, [data, tab, search, date]);

  const replace = (u) => setData((l) => l.map((x) => (x._id === u._id ? u : x)));

  const approve = async (a) => {
    setBusy(a._id);
    try {
      const { data: u } = await api.patch(`/appointments/${a._id}/approve`);
      replace(u);
      toast.success(`Approved ${a.patient.fullName}'s appointment`);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); }
  };

  const cancel = async () => {
    setBusy(cancelling._id);
    try {
      const { data: u } = await api.patch(`/appointments/${cancelling._id}/cancel`);
      replace(u);
      toast.success('Appointment cancelled');
      setCancelling(null);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Manage appointments" subtitle="Approve new requests and keep the schedule running smoothly" />
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Tabs value={tab} onChange={setTab} tabs={['Pending', 'Approved', 'Completed', 'Cancelled', 'All'].map((s) => ({
          value: s, label: s, count: s === 'All' ? data.length : counts[s] || 0,
        }))} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Patient or doctor…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <input type="date" className="input sm:w-44" value={date} onChange={(e) => setDate(e.target.value)} />
            {date && <Button variant="ghost" onClick={() => setDate('')}>Clear</Button>}
          </div>
        </div>
      </div>

      <Card>
        {list.length === 0 ? <EmptyState icon={CalendarDays} title="No appointments" message={tab === 'Pending' ? 'All caught up. No requests waiting.' : 'Nothing matches these filters.'} /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Patient</th><th>Doctor</th><th>Date & time</th><th>Fee</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={a.patient?.fullName} size="sm" />
                        <div><p className="font-medium">{a.patient?.fullName}</p><p className="text-xs text-slate-500">{a.patient?.contactNumber || a.patient?.email}</p></div>
                      </div>
                    </td>
                    <td><p className="font-medium">{a.doctor?.fullName}</p><p className="text-xs text-slate-500">{a.doctor?.specialization}</p></td>
                    <td className="whitespace-nowrap"><p>{fmtDate(a.date)}</p><p className="flex items-center gap-2 text-xs text-slate-500">{fmtTime(a.startTime)} – {fmtTime(a.endTime)} <ModeBadge mode={a.mode} /></p></td>
                    <td className="tabular-nums">{money(a.consultationFee)}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      <div className="flex justify-end gap-2">
                        {a.status === 'Pending' && <Button size="sm" icon={Check} loading={busy === a._id} onClick={() => approve(a)}>Approve</Button>}
                        {['Pending', 'Approved'].includes(a.status) && <Button size="sm" variant="dangerSoft" icon={X} onClick={() => setCancelling(a)}>Cancel</Button>}
                        {['Completed', 'Cancelled'].includes(a.status) && <Link to={`/app/appointments/${a._id}`}><Button size="sm" variant="secondary" icon={FileText}>View</Button></Link>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog open={Boolean(cancelling)} onClose={() => setCancelling(null)} onConfirm={cancel} loading={busy === cancelling?._id} danger
        title="Cancel this appointment?" confirmText="Cancel appointment"
        message={cancelling && `${cancelling.patient.fullName} with ${cancelling.doctor.fullName}, ${fmtDate(cancelling.date)} at ${fmtTime(cancelling.startTime)}. The slot will be released.`} />
    </>
  );
}
