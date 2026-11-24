import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertTriangle, Users, FileHeart } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import { Avatar, Badge, Button, Card, EmptyState, ErrorBox, PageHeader, PageLoader, Tabs } from '@/components/ui';
import { severityTone } from '@/components/charts/ScoreChart';
import { fmtDate } from '@/utils/format';

export default function PatientsList() {
  const { user } = useAuth();
  const { data = [], loading, error, reload } = useFetch('/patients', []);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const list = useMemo(() => {
    const s = search.toLowerCase();
    return data
      .filter((p) => tab === 'all' || (tab === 'risk' ? p.openRisk > 0 : (p.scores.PHQ9?.score >= 10 || p.scores.GAD7?.score >= 10)))
      .filter((p) => !s || p.fullName.toLowerCase().includes(s) || p.email.toLowerCase().includes(s))
      .sort((a, b) => b.openRisk - a.openRisk || (b.lastVisit || '').localeCompare(a.lastVisit || ''));
  }, [data, search, tab]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const riskCount = data.filter((p) => p.openRisk > 0).length;
  const elevated = data.filter((p) => p.scores.PHQ9?.score >= 10 || p.scores.GAD7?.score >= 10).length;

  return (
    <>
      <PageHeader title={user.role === 'Doctor' ? 'My patients' : 'Patients'} subtitle="Clinical overview with the latest screening scores" />
      {riskCount > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <AlertTriangle className="size-5 text-rose-600" />
          <span className="flex-1"><b>{riskCount} patient{riskCount > 1 ? 's have' : ' has'}</b> an unreviewed risk alert from a self-assessment.</span>
          <Button size="sm" variant="danger" onClick={() => setTab('risk')}>Show</Button>
        </div>
      )}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: 'all', label: 'All', count: data.length },
          { value: 'elevated', label: 'Elevated scores', count: elevated },
          { value: 'risk', label: 'Risk alerts', count: riskCount },
        ]} />
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search patient…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <Card>
        {list.length === 0 ? <EmptyState icon={Users} title="No patients found" /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Patient</th><th>Visits</th><th>Last visit</th><th>PHQ-9</th><th>GAD-7</th><th /></tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={p.fullName} size="sm" />
                        <div>
                          <p className="flex items-center gap-2 font-medium">{p.fullName}{p.openRisk > 0 && <Badge tone="rose"><AlertTriangle className="size-3" />Risk</Badge>}</p>
                          <p className="text-xs text-slate-500">{[p.age && `${p.age} yrs`, p.gender, p.contactNumber].filter(Boolean).join(' · ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="tabular-nums">{p.visits}</td>
                    <td className="whitespace-nowrap">{p.lastVisit ? fmtDate(p.lastVisit) : '—'}</td>
                    <td>{p.scores.PHQ9 ? <Badge tone={severityTone(p.scores.PHQ9.severity)}>{p.scores.PHQ9.score} · {p.scores.PHQ9.severity}</Badge> : <span className="text-slate-400">—</span>}</td>
                    <td>{p.scores.GAD7 ? <Badge tone={severityTone(p.scores.GAD7.severity)}>{p.scores.GAD7.score} · {p.scores.GAD7.severity}</Badge> : <span className="text-slate-400">—</span>}</td>
                    <td className="text-right"><Link to={`/app/patients/${p._id}`}><Button size="sm" variant="secondary" icon={FileHeart}>Record</Button></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
