import { Link } from 'react-router-dom';
import { Hourglass, CalendarDays, Receipt, TestTubes, Wallet, ArrowRight } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, ErrorBox, PageLoader, StatCard, cx } from '@/components/ui';
import UpcomingList from '@/components/appointments/UpcomingList';
import { fmtDate, greeting, todayStr } from '@/utils/format';

export default function StaffDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/dashboard');
  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { stats, upcoming } = data;

  const tasks = [
    { to: '/app/appointments', icon: Hourglass, label: 'Appointments to approve', count: stats.pending, tone: 'amber' },
    { to: '/app/lab-tests', icon: TestTubes, label: 'Lab tests to run', count: stats.labPending, tone: 'violet' },
    { to: '/app/billing', icon: Receipt, label: 'Visits waiting for an invoice', count: stats.unbilled, tone: 'brand' },
  ];
  const tones = { amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600', brand: 'bg-brand-50 text-brand-600' };

  return (
    <>
      <div className="mb-8">
        <p className="text-sm text-slate-500">{greeting()} · {fmtDate(todayStr(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Front desk, {user.fullName.split(' ')[0]}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Hourglass} label="Pending approval" value={stats.pending} tone="amber" />
        <StatCard icon={CalendarDays} label="Appointments today" value={stats.todayCount} tone="brand" />
        <StatCard icon={TestTubes} label="Lab queue" value={stats.labPending} tone="violet" />
        <StatCard icon={Wallet} label="Unpaid invoices" value={stats.unpaidInvoices} tone="rose" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Card>
          <CardHeader title="Your to-do list" />
          <ul className="space-y-3 p-5">
            {tasks.map(({ to, icon: Icon, label, count, tone }) => (
              <li key={to}>
                <Link to={to} className="group flex items-center gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-slate-200 hover:bg-slate-50">
                  <span className={cx('grid size-11 place-items-center rounded-xl', tones[tone])}><Icon className="size-5" /></span>
                  <span className="flex-1 text-sm font-semibold">{label}</span>
                  <span className={cx('font-display text-2xl font-extrabold', count ? 'text-slate-900' : 'text-slate-300')}>{count}</span>
                  <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Upcoming appointments" icon={CalendarDays}
            action={<Link to="/app/appointments" className="text-sm font-semibold text-brand-600">Manage</Link>} />
          <UpcomingList items={upcoming} show="both" />
        </Card>
      </div>
    </>
  );
}
