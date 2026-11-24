import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Wallet, FlaskConical, Search, ArrowRight, Pill, Sparkles, HeartPulse } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, CardHeader, ErrorBox, PageLoader, StatCard } from '@/components/ui';
import UpcomingList from '@/components/appointments/UpcomingList';
import { MOODS } from '@/constants/mood';
import { fmtDate, greeting, money } from '@/utils/format';

const tips = [
  'A short walk outside can lift your mood. Even 10 minutes helps.',
  'Try box breathing: in for 4, hold 4, out for 4, hold 4.',
  'Consistent sleep and wake times support emotional balance.',
  'Talking to someone you trust is a sign of strength.',
];

export default function PatientDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/dashboard');
  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { stats, upcoming, latest } = data;
  const tip = tips[new Date().getDate() % tips.length];

  return (
    <>
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-linear-to-br from-brand-600 via-brand-600 to-indigo-600 p-6 text-white shadow-xl shadow-brand-600/20 sm:p-8">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/75">{greeting()},</p>
            <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">{user.fullName.split(' ')[0]} 👋</h1>
            <p className="mt-2 flex max-w-lg items-start gap-2 text-sm text-white/85"><Sparkles className="mt-0.5 size-4 shrink-0" />{tip}</p>
          </div>
          <Link to="/app/doctors"><Button size="lg" variant="secondary" icon={Search} className="border-0">Book an appointment</Button></Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarDays} label="Upcoming visits" value={stats.upcoming} tone="brand" />
        <StatCard icon={CheckCircle2} label="Completed visits" value={stats.completed} tone="indigo" />
        <StatCard icon={Wallet} label="Unpaid bills" value={money(stats.unpaidAmount)} hint={`${stats.unpaid} invoice${stats.unpaid === 1 ? '' : 's'}`} tone="amber" />
        <StatCard icon={FlaskConical} label="Tests awaiting reply" value={stats.pendingTests} tone="violet" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Upcoming appointments" icon={CalendarDays}
            action={<Link to="/app/my-appointments" className="text-sm font-semibold text-brand-600 hover:text-brand-700">View all</Link>} />
          <UpcomingList items={upcoming} show="doctor"
            emptyAction={<Link to="/app/doctors"><Button size="sm" icon={Search}>Find a doctor</Button></Link>} />
        </Card>

        <div className="space-y-6">
          <WellbeingCard w={data.wellbeing} />
          <Card>
            <CardHeader title="Latest prescription" icon={Pill} />
            {latest ? (
              <div className="p-5">
                <p className="text-sm text-slate-500">{fmtDate(latest.date)} · {latest.doctor.fullName}</p>
                <p className="mt-2 font-semibold">{latest.diagnosis}</p>
                <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-slate-600">{latest.prescription || 'No medicine prescribed'}</p>
                <Link to={`/app/appointments/${latest._id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">Open prescription <ArrowRight className="size-4" /></Link>
              </div>
            ) : <p className="p-5 text-sm text-slate-500">Your prescriptions will appear here after your first visit.</p>}
          </Card>
          {stats.unpaid > 0 && (
            <Card className="flex items-center gap-4 border-amber-200 bg-amber-50/60 p-5">
              <span className="grid size-11 place-items-center rounded-xl bg-amber-100 text-amber-600"><Wallet className="size-5" /></span>
              <div className="flex-1"><p className="font-semibold">You have {stats.unpaid} unpaid bill{stats.unpaid > 1 ? 's' : ''}</p><p className="text-sm text-slate-600">Total due {money(stats.unpaidAmount)}</p></div>
              <Link to="/app/bills"><Button size="sm">Pay now</Button></Link>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function WellbeingCard({ w }) {
  if (!w) return null;
  const mood = w.moodToday && MOODS[w.moodToday.mood - 1];
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Wellbeing" icon={HeartPulse} action={<Link to="/app/assessments" className="text-sm font-semibold text-brand-600">Self-check</Link>} />
      <div className="p-5">
        <Link to="/app/wellbeing" className="flex items-center gap-4 rounded-2xl bg-linear-to-r from-brand-50 to-indigo-50 p-4 transition hover:from-brand-100/70">
          <span className="text-4xl">{mood ? mood.emoji : '📝'}</span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-slate-900">{mood ? `Today you feel ${mood.label.toLowerCase()}` : 'How are you feeling today?'}</span>
            <span className="text-xs text-slate-500">{mood ? 'Tap to update your check-in' : 'Log a 1-minute mood check-in'}</span>
          </span>
          <ArrowRight className="size-4 text-slate-400" />
        </Link>
        {w.recentMoods.length > 0 && (
          <div className="mt-4 flex items-end justify-between gap-1">
            {w.recentMoods.map((m) => (
              <div key={m.date} className="flex flex-1 flex-col items-center gap-1" title={`${m.date}: ${MOODS[m.mood - 1].label}`}>
                <span className="w-full rounded-md bg-brand-500/80" style={{ height: `${m.mood * 9}px` }} />
                <span className="text-[10px] text-slate-400">{new Date(`${m.date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'narrow' })}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {[['Depression', w.phq, 27], ['Anxiety', w.gad, 21]].map(([label, a, max]) => (
            <div key={label} className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs text-slate-500">{label}</p>
              {a ? <p className="font-display text-lg font-extrabold">{a.score}<span className="text-xs font-medium text-slate-400">/{max}</span> <span className="text-xs font-semibold text-slate-500">{a.severity}</span></p>
                : <p className="text-xs text-slate-400">Not taken</p>}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
