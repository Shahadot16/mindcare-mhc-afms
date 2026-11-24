import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarCheck, FlaskConical, Receipt, TrendingUp, Stethoscope, Search,
  CalendarDays, Wallet, UserCircle, LogOut, Menu, X, TestTubes, MessageCircle, HeartPulse, ClipboardCheck,
  Contact, CalendarClock, PiggyBank, Banknote, Scale, Activity, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRealtime } from '@/context/RealtimeContext';
import Logo from '@/components/layout/Logo';
import NotificationBell from '@/components/layout/NotificationBell';
import { Avatar, PageLoader, cx } from '@/components/ui';

// Navigation per role, grouped into sections
const NAV = {
  Admin: [
    ['Overview', [
      { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/app/analytics', label: 'Analytics', icon: Activity },
    ]],
    ['Clinic', [
      { to: '/app/appointments', label: 'Appointments', icon: CalendarCheck },
      { to: '/app/patients', label: 'Patients', icon: Contact },
      { to: '/app/employees', label: 'Employees', icon: Users },
      { to: '/app/lab-tests', label: 'Lab Queue', icon: TestTubes },
      { to: '/app/tests', label: 'Medical Tests', icon: FlaskConical },
    ]],
    ['Finance', [
      { to: '/app/billing', label: 'Billing', icon: Receipt },
      { to: '/app/finance', label: 'Revenue', icon: TrendingUp },
      { to: '/app/expenses', label: 'Expenses', icon: PiggyBank },
      { to: '/app/payroll', label: 'Payroll', icon: Banknote },
      { to: '/app/profit-loss', label: 'Profit & Loss', icon: Scale },
    ]],
    ['System', [{ to: '/app/audit', label: 'Audit Log', icon: ShieldCheck }]],
  ],
  Staff: [
    ['Front desk', [
      { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/app/appointments', label: 'Appointments', icon: CalendarCheck },
      { to: '/app/lab-tests', label: 'Lab Queue', icon: TestTubes },
      { to: '/app/billing', label: 'Billing', icon: Receipt },
      { to: '/app/tests', label: 'Medical Tests', icon: FlaskConical },
    ]],
  ],
  Doctor: [
    ['Practice', [
      { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/app/doctor/appointments', label: 'Appointments', icon: Stethoscope },
      { to: '/app/patients', label: 'My Patients', icon: Contact },
      { to: '/app/messages', label: 'Messages', icon: MessageCircle, badge: 'msg' },
      { to: '/app/schedule', label: 'Schedule & Leave', icon: CalendarClock },
    ]],
  ],
  Patient: [
    ['My care', [
      { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/app/doctors', label: 'Find a Doctor', icon: Search },
      { to: '/app/my-appointments', label: 'My Appointments', icon: CalendarDays },
      { to: '/app/messages', label: 'Messages', icon: MessageCircle, badge: 'msg' },
      { to: '/app/bills', label: 'My Bills', icon: Wallet },
    ]],
    ['Wellbeing', [
      { to: '/app/wellbeing', label: 'Mood Tracker', icon: HeartPulse },
      { to: '/app/assessments', label: 'Self-assessments', icon: ClipboardCheck },
    ]],
  ],
};

const roleLabel = { Admin: 'Administrator', Staff: 'Front Desk Staff', Doctor: 'Doctor', Patient: 'Patient' };

function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const { msgUnread } = useRealtime();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="px-5 pb-5 pt-6"><Link to="/" onClick={onNavigate}><Logo light /></Link></div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {(NAV[user.role] || []).map(([section, items]) => (
          <div key={section}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{section}</p>
            <div className="space-y-0.5">
              {items.map(({ to, label, icon: Icon, end, badge }) => (
                <NavLink key={to} to={to} end={end} onClick={onNavigate}
                  className={({ isActive }) => cx(
                    'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                    isActive ? 'bg-linear-to-r from-brand-500/20 to-brand-500/5 text-white ring-1 ring-inset ring-brand-400/20' : 'hover:bg-white/5 hover:text-white'
                  )}>
                  {({ isActive }) => (<>
                    <Icon className={cx('size-4.5', isActive ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300')} />
                    <span className="flex-1">{label}</span>
                    {badge === 'msg' && msgUnread > 0 && <span className="rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white">{msgUnread}</span>}
                  </>)}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
        <div>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Account</p>
          <NavLink to="/app/profile" onClick={onNavigate}
            className={({ isActive }) => cx('flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
              isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white')}>
            <UserCircle className="size-4.5 text-slate-500" /> Profile
          </NavLink>
        </div>
      </nav>

      <div className="m-3 rounded-2xl bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <Avatar name={user.fullName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.fullName}</p>
            <p className="truncate text-xs text-slate-400">{roleLabel[user.role]}</p>
          </div>
          <button title="Log out" onClick={() => { logout(); navigate('/login'); }}
            className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white cursor-pointer">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TopBar({ onMenu }) {
  const { user } = useAuth();
  const { msgUnread, connected } = useRealtime();
  const canChat = ['Doctor', 'Patient'].includes(user.role);
  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <button onClick={onMenu} className="grid size-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
        <Menu className="size-5" />
      </button>
      <span className="lg:hidden"><Logo /></span>
      <span className="ml-auto hidden items-center gap-1.5 text-xs text-slate-400 sm:flex" title={connected ? 'Live updates on' : 'Reconnecting…'}>
        <span className={cx('size-2 rounded-full', connected ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse')} />
        {connected ? 'Live' : 'Offline'}
      </span>
      <div className="ml-auto flex items-center gap-1 sm:ml-3">
        {canChat && (
          <Link to="/app/messages" aria-label="Messages" className="relative grid size-10 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100">
            <MessageCircle className="size-5" />
            {msgUnread > 0 && <span className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-brand-500 ring-2 ring-white" />}
          </Link>
        )}
        <NotificationBell />
        <Link to="/app/profile" className="ml-1 hidden sm:block" aria-label="Profile"><Avatar name={user.fullName} size="sm" /></Link>
      </div>
    </header>
  );
}

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 lg:block"><Sidebar /></aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85vw] animate-fade-up">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-6 z-10 grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-white/10" aria-label="Close menu">
              <X className="size-5" />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <TopBar onMenu={() => setOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Suspense fallback={<PageLoader />}>
          <div key={pathname} className="animate-fade-up"><Outlet /></div>
        </Suspense>
      </main>
    </div>
  );
}
