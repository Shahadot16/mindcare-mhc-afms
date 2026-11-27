import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarDays, Clock, Search, FileText, XCircle, FlaskConical } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import useFetch from '@/hooks/useFetch';
import { Avatar, Button, Card, ConfirmDialog, EmptyState, ErrorBox, PageHeader, PageLoader, StatusBadge, Tabs } from '@/components/ui';
import { fmtDate, fmtTime, money, todayStr } from '@/utils/format';
import { JoinCallButton, ModeBadge } from '@/components/appointments/VideoCall';

export default function MyAppointments() {
  const { data = [], loading, error, reload, setData } = useFetch('/appointments/mine', []);
  const [tab, setTab] = useState('upcoming');
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(false);

  const today = todayStr();
  const groups = useMemo(() => ({
    upcoming: data.filter((a) => ['Pending', 'Approved'].includes(a.status) && a.date >= today),
    completed: data.filter((a) => a.status === 'Completed'),
    cancelled: data.filter((a) => a.status === 'Cancelled' || (['Pending', 'Approved'].includes(a.status) && a.date < today)),
  }), [data, today]);

  const cancel = async () => {
    setBusy(true);
    try {
      const { data: updated } = await api.patch(`/appointments/${cancelling._id}/cancel`);
      setData((list) => list.map((a) => (a._id === updated._id ? updated : a)));
      toast.success('Appointment cancelled');
      setCancelling(null);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const list = groups[tab];

  return (
    <>
      <PageHeader title="My appointments" subtitle="Your visit history and prescriptions"
        action={<Link to="/app/doctors"><Button icon={Search}>Book new</Button></Link>} />

      <div className="mb-5">
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: 'upcoming', label: 'Upcoming', count: groups.upcoming.length },
          { value: 'completed', label: 'Completed', count: groups.completed.length },
          { value: 'cancelled', label: 'Cancelled / missed', count: groups.cancelled.length },
        ]} />
      </div>

      {list.length === 0 ? (
        <Card><EmptyState icon={CalendarDays} title={`No ${tab} appointments`}
          action={tab === 'upcoming' && <Link to="/app/doctors"><Button size="sm">Find a doctor</Button></Link>} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((a) => {
            const pendingTests = a.tests?.filter((t) => t.status === 'Suggested').length || 0;
            return (
              <Card key={a._id} className="flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={a.doctor.fullName} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{a.doctor.fullName}</p>
                    <p className="text-sm text-slate-500">{a.doctor.specialization}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5"><CalendarDays className="size-4 text-slate-400" />{fmtDate(a.date)}</span>
                  <span className="flex items-center gap-1.5"><Clock className="size-4 text-slate-400" />{fmtTime(a.startTime)}</span>
                  <span className="text-slate-500">{money(a.consultationFee)}</span>
                  <ModeBadge mode={a.mode} />
                </div>
                {a.cancelledBy === 'No-show' && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">Marked as missed: you did not join the video call.</p>}
                {a.status === 'Completed' && a.diagnosis && <p className="mt-3 line-clamp-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600"><b>Diagnosis:</b> {a.diagnosis}</p>}
                {pendingTests > 0 && !a.isInvoiceGenerated && (
                  <p className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-700"><FlaskConical className="size-4" />{pendingTests} suggested test{pendingTests > 1 ? 's' : ''} need your reply</p>
                )}
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <JoinCallButton appointment={a} />
                  <Link to={`/app/appointments/${a._id}`}><Button size="sm" variant="secondary" icon={FileText}>{a.status === 'Completed' ? 'Prescription' : 'Details'}</Button></Link>
                  {tab === 'upcoming' && <Button size="sm" variant="dangerSoft" icon={XCircle} onClick={() => setCancelling(a)}>Cancel</Button>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={Boolean(cancelling)} onClose={() => setCancelling(null)} onConfirm={cancel} loading={busy} danger
        title="Cancel appointment?" confirmText="Yes, cancel"
        message={cancelling && `Your ${fmtTime(cancelling.startTime)} appointment with ${cancelling.doctor.fullName} on ${fmtDate(cancelling.date)} will be cancelled and the slot released.`} />
    </>
  );
}
