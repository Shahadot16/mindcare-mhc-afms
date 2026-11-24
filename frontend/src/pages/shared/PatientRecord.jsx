import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, AlertTriangle, MessageCircle, Stethoscope, CalendarDays, Smile, Brain, Wind, FileText, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import useFetch from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import { Avatar, Badge, Button, Card, CardHeader, ErrorBox, PageLoader, StatCard, StatusBadge } from '@/components/ui';
import ScoreChart, { severityTone } from '@/components/charts/ScoreChart';
import { MOODS } from '@/constants/mood';
import { addDaysStr, fmtDate, fmtTime, todayStr } from '@/utils/format';

export default function PatientRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(`/patients/${id}/record`);

  const moodSeries = useMemo(() => {
    if (!data) return [];
    const map = new Map(data.moods.map((m) => [m.date, m.mood]));
    const out = [];
    for (let d = addDaysStr(todayStr(), -59); d <= todayStr(); d = addDaysStr(d, 1)) out.push({ date: d, mood: map.get(d) ?? null });
    return out;
  }, [data]);

  const review = async (a) => {
    try {
      await api.patch(`/assessments/${a._id}/review`);
      toast.success('Marked as reviewed');
      reload({ silent: true });
    } catch (e) { toast.error(errMsg(e)); }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { patient: p, summary: s, appointments, assessments } = data;
  const risks = assessments.filter((a) => a.riskFlag && !a.reviewedAt);

  return (
    <>
      <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)} className="mb-4">Back</Button>

      <Card className="mb-6 overflow-hidden">
        <div className="h-20 bg-linear-to-r from-brand-600 to-indigo-600" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
          <Avatar name={p.fullName} size="xl" className="-mt-10 ring-4 ring-white" />
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold">{p.fullName}</h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
              {(p.age || p.gender) && <span>{[p.age && `${p.age} years`, p.gender].filter(Boolean).join(' · ')}</span>}
              {p.contactNumber && <span className="flex items-center gap-1"><Phone className="size-3.5" />{p.contactNumber}</span>}
              <span className="flex items-center gap-1"><Mail className="size-3.5" />{p.email}</span>
              {p.address && <span className="flex items-center gap-1"><MapPin className="size-3.5" />{p.address}</span>}
            </div>
          </div>
          {user.role === 'Doctor' && <Link to={`/app/messages?with=${p._id}`}><Button icon={MessageCircle}>Message</Button></Link>}
        </div>
      </Card>

      {risks.length > 0 && (
        <div className="mb-6 space-y-2">
          {risks.map((a) => (
            <div key={a._id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
              <AlertTriangle className="size-5 text-rose-600" />
              <span className="flex-1"><b>Risk alert</b>: {a.type === 'PHQ9' ? 'PHQ-9' : 'GAD-7'} on {fmtDate(a.createdAt)} indicated thoughts of self-harm (score {a.score}, {a.severity}). Contact the patient and assess safety.</span>
              <Button size="sm" variant="danger" icon={CheckCircle2} onClick={() => review(a)}>Mark reviewed</Button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Stethoscope} label="Completed visits" value={s.visits} hint={s.firstVisit ? `Since ${fmtDate(s.firstVisit, { month: 'short', year: 'numeric' })}` : 'No visits yet'} tone="brand" />
        <StatCard icon={Brain} label="Latest PHQ-9" value={s.latestPHQ9 ? `${s.latestPHQ9.score} / 27` : '—'} hint={s.latestPHQ9?.severity} tone="indigo" />
        <StatCard icon={Wind} label="Latest GAD-7" value={s.latestGAD7 ? `${s.latestGAD7.score} / 21` : '—'} hint={s.latestGAD7?.severity} tone="violet" />
        <StatCard icon={Smile} label="Avg mood (60 days)" value={s.avgMood ? `${s.avgMood} / 5` : '—'} hint={`${data.moods.length} check-ins`} tone="emerald" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><CardHeader title="Depression (PHQ-9)" subtitle="Lower is better" icon={Brain} /><div className="px-2 py-4 sm:px-4"><ScoreChart type="PHQ9" items={assessments} /></div></Card>
        <Card><CardHeader title="Anxiety (GAD-7)" subtitle="Lower is better" icon={Wind} /><div className="px-2 py-4 sm:px-4"><ScoreChart type="GAD7" items={assessments} /></div></Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Daily mood (last 60 days)" icon={Smile} />
        <div className="h-52 px-2 py-4 sm:px-4">
          {data.moods.length === 0 ? <p className="grid h-full place-items-center text-sm text-slate-500">The patient hasn't logged any mood check-ins.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#eef2f6" />
                <XAxis dataKey="date" tickFormatter={(d) => fmtDate(d, { day: 'numeric', month: 'short' })} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} minTickGap={28} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickFormatter={(v) => MOODS[v - 1].emoji} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v) => [`${MOODS[v - 1].emoji} ${MOODS[v - 1].label}`, 'Mood']} labelFormatter={(d) => fmtDate(d)} />
                <Area type="monotone" dataKey="mood" stroke="#0a8577" strokeWidth={2} fill="#0a857722" connectNulls dot={{ r: 2.5, fill: '#0a8577', strokeWidth: 0 }} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Visit history" subtitle={`${appointments.length} appointments`} icon={CalendarDays} />
        <ol className="relative space-y-0 p-5">
          {appointments.slice(0, 30).map((a, i) => (
            <li key={a._id} className="relative flex gap-4 pb-5">
              {i < Math.min(appointments.length, 30) - 1 && <span className="absolute left-[7px] top-5 h-full w-px bg-slate-200" />}
              <span className={`relative z-10 mt-1.5 size-3.5 shrink-0 rounded-full ring-4 ${a.status === 'Completed' ? 'bg-emerald-500 ring-emerald-100' : a.status === 'Cancelled' ? 'bg-slate-300 ring-slate-100' : 'bg-sky-500 ring-sky-100'}`} />
              <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{fmtDate(a.date)} · {fmtTime(a.startTime)}</p>
                  <StatusBadge status={a.status} />
                  <span className="text-sm text-slate-500">{a.doctor.fullName}</span>
                </div>
                {a.diagnosis && <p className="mt-2 text-sm"><b>Diagnosis:</b> {a.diagnosis}</p>}
                {a.prescription && <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-slate-600">{a.prescription}</p>}
                {a.tests?.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{a.tests.map((t) => (
                  <span key={t._id} className={`rounded-lg px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-violet-50 text-violet-700 ring-violet-200'}`}>
                    {t.testName}{t.result ? `: ${t.result}` : ''}
                  </span>
                ))}</div>}
                {a.status === 'Completed' && <Link to={`/app/appointments/${a._id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600"><FileText className="size-3.5" />Full notes</Link>}
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {assessments.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="All assessments" />
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Type</th><th>Score</th><th>Severity</th><th>Flag</th></tr></thead>
              <tbody>
                {[...assessments].reverse().map((a) => (
                  <tr key={a._id}>
                    <td>{fmtDate(a.createdAt)}</td>
                    <td>{a.type === 'PHQ9' ? 'PHQ-9' : 'GAD-7'}</td>
                    <td className="tabular-nums font-semibold">{a.score}</td>
                    <td><Badge tone={severityTone(a.severity)}>{a.severity}</Badge></td>
                    <td>{a.riskFlag ? <Badge tone="rose">{a.reviewedAt ? 'Reviewed' : 'Risk'}</Badge> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
