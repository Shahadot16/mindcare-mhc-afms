import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Stethoscope, FileText, Pencil, CalendarDays, FileHeart } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { Avatar, Button, Card, EmptyState, ErrorBox, PageHeader, PageLoader, StatusBadge, Tabs } from '@/components/ui';
import DiagnosisModal from '@/components/appointments/DiagnosisModal';
import { fmtDate, fmtTime, todayStr } from '@/utils/format';
import { JoinCallButton, ModeBadge } from '@/components/appointments/VideoCall';

export default function DoctorAppointments() {
  const { data = [], setData, loading, error, reload } = useFetch('/appointments/doctor', []);
  const [tab, setTab] = useState('Approved');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(null);

  const counts = useMemo(() => data.reduce((m, a) => ({ ...m, [a.status]: (m[a.status] || 0) + 1 }), {}), [data]);
  const list = useMemo(() => {
    const s = search.toLowerCase();
    return data
      .filter((a) => tab === 'All' || a.status === tab)
      .filter((a) => !s || a.patient.fullName.toLowerCase().includes(s))
      .sort((x, y) => (tab === 'Approved' || tab === 'Pending'
        ? (x.date + x.startTime).localeCompare(y.date + y.startTime)
        : (y.date + y.startTime).localeCompare(x.date + x.startTime)));
  }, [data, tab, search]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="My patients" subtitle="See approved patients, write prescriptions and review past visits" />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: 'Approved', label: 'To see', count: counts.Approved || 0 },
          { value: 'Pending', label: 'Awaiting approval', count: counts.Pending || 0 },
          { value: 'Completed', label: 'Completed', count: counts.Completed || 0 },
          { value: 'All', label: 'All', count: data.length },
        ]} />
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search patient…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card>
        {list.length === 0 ? <EmptyState icon={CalendarDays} title="Nothing here" message="No appointments match this view." /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Patient</th><th>Date & time</th><th>Reason</th><th>Status</th><th className="text-right">Action</th></tr></thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={a.patient.fullName} size="sm" />
                        <div><p className="font-medium">{a.patient.fullName}</p><p className="text-xs text-slate-500">{[a.patient.age && `${a.patient.age} yrs`, a.patient.gender].filter(Boolean).join(' · ')}</p></div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap"><p>{fmtDate(a.date)}</p><p className="flex items-center gap-2 text-xs text-slate-500">{fmtTime(a.startTime)} <ModeBadge mode={a.mode} /></p></td>
                    <td className="max-w-xs"><p className="line-clamp-2 text-slate-600">{a.status === 'Completed' ? a.diagnosis : a.description || '—'}</p></td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Link to={`/app/patients/${a.patient._id}`} title="Patient record"><Button size="sm" variant="ghost" icon={FileHeart} /></Link>
                        <JoinCallButton appointment={a} role="Doctor" />
                        {a.status === 'Approved' && (a.date <= todayStr()
                          ? <Button size="sm" icon={Stethoscope} onClick={() => setActive(a)}>See patient</Button>
                          : <span className="text-xs font-medium text-slate-400">Scheduled</span>)}
                        {a.status === 'Completed' && !a.isInvoiceGenerated && <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setActive(a)}>Edit</Button>}
                        {a.status === 'Completed' && <Link to={`/app/appointments/${a._id}`}><Button size="sm" variant="secondary" icon={FileText}>View</Button></Link>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {active && <DiagnosisModal appointment={active} onClose={() => setActive(null)}
        onSaved={(updated) => { setData((l) => l.map((x) => (x._id === updated._id ? updated : x))); setActive(null); }} />}
    </>
  );
}
