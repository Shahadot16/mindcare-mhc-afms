import { Link } from 'react-router-dom';
import { Stethoscope, Users, UserRound, Hourglass, CalendarDays, TrendingUp, AlertCircle, FlaskConical, UserPlus, BarChart3, ArrowRight } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, CardHeader, ErrorBox, PageLoader, StatCard } from '@/components/ui';
import UpcomingList from '@/components/appointments/UpcomingList';
import RiskAlerts from '@/components/patients/RiskAlerts';
import { fmtDate, greeting, money, todayStr } from '@/utils/format';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/dashboard');
  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { stats, upcoming } = data;

  const quick = [
    { to: '/app/employees', icon: UserPlus, label: 'Hire employee', text: 'Add a doctor or staff member' },
    { to: '/app/appointments', icon: Hourglass, label: 'Approve requests', text: `${stats.pending} waiting` },
    { to: '/app/profit-loss', icon: BarChart3, label: 'Profit & loss', text: 'Revenue, costs and margin' },
    { to: '/app/analytics', icon: TrendingUp, label: 'Analytics', text: 'Busiest hours, utilisation' },
    { to: '/app/payroll', icon: Users, label: 'Payroll', text: 'Salaries & commission' },
    { to: '/app/tests', icon: FlaskConical, label: 'Medical tests', text: `${stats.tests} active tests` },
  ];

  return (
    <>
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-ink p-6 text-white sm:p-8">
        <div aria-hidden className="absolute -right-20 -top-24 size-72 rounded-full border-[40px] border-white/5" />
        <div aria-hidden className="absolute -bottom-32 left-1/3 size-60 rounded-full bg-brand-700/40" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-slate-400">{greeting()} · {fmtDate(todayStr(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Welcome back, {user.fullName.split(' ')[0]}</h1>
            <p className="mt-1 text-sm text-slate-400">Here's how the clinic is doing today.</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <div><p className="text-sm text-slate-400">This month</p><p className="font-display text-3xl font-bold">{money(stats.monthRevenue)}</p></div>
            <div><p className="text-sm text-slate-400">Outstanding</p><p className="font-display text-3xl font-bold text-amber-300">{money(stats.outstanding)}</p></div>
          </div>
        </div>
      </div>

      <RiskAlerts />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard icon={Stethoscope} label="Doctors" value={stats.doctors} tone="brand" />
        <StatCard icon={Users} label="Staff" value={stats.staff} tone="sky" />
        <StatCard icon={UserRound} label="Patients" value={stats.patients} tone="sky" />
        <StatCard icon={CalendarDays} label="Appointments today" value={stats.todayCount} hint={`${stats.pending} pending approval`} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Card>
          <CardHeader title="Quick actions" />
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {quick.map(({ to, icon: Icon, label, text }) => (
              <Link key={to} to={to} className="group rounded-2xl border border-slate-100 p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50/40">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white"><Icon className="size-5" /></span>
                <p className="mt-3 flex items-center gap-1 text-sm font-bold">{label}<ArrowRight className="size-3.5 opacity-0 transition group-hover:opacity-100" /></p>
                <p className="text-xs text-slate-500">{text}</p>
              </Link>
            ))}
          </div>
          {stats.pending > 0 && (
            <div className="mx-5 mb-5 flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-sm ring-1 ring-amber-200">
              <AlertCircle className="size-5 text-amber-600" />
              <span className="flex-1 text-amber-900">{stats.pending} appointment request{stats.pending > 1 ? 's need' : ' needs'} approval</span>
              <Link to="/app/appointments"><Button size="sm" variant="secondary">Review</Button></Link>
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Upcoming appointments" icon={TrendingUp}
            action={<Link to="/app/appointments" className="text-sm font-semibold text-brand-600">View all</Link>} />
          <UpcomingList items={upcoming} show="both" />
        </Card>
      </div>
    </>
  );
}
