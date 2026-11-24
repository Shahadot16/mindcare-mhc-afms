import { Link } from 'react-router-dom';
import {
  ArrowRight, CalendarCheck, ShieldCheck, Stethoscope, Wallet, BarChart3, FlaskConical, Clock, HeartHandshake, Sparkles, CheckCircle2,
} from 'lucide-react';
import Logo from '@/components/layout/Logo';
import { useAuth } from '@/context/AuthContext';

const features = [
  { icon: CalendarCheck, title: 'Smart slot booking', text: 'Patients pick a doctor and a free 15-minute slot. Double-booking is impossible, and doctor leave is respected.' },
  { icon: HeartHandshake, title: 'Mood tracker & screenings', text: 'Daily mood check-ins plus PHQ-9 and GAD-7 self-assessments, charted over time for patient and doctor.' },
  { icon: ShieldCheck, title: 'Risk alerts', text: 'If a screening shows thoughts of self-harm, the patient’s doctors are alerted instantly.' },
  { icon: Stethoscope, title: 'Digital prescriptions', text: 'Doctors record diagnosis, prescriptions, follow-ups and suggested tests, with the full patient record one click away.' },
  { icon: Sparkles, title: 'Live notifications & chat', text: 'Real-time updates for every step, and secure messaging between patients and their doctors.' },
  { icon: FlaskConical, title: 'Lab test workflow', text: 'Patients accept or decline suggested tests; staff run them and publish results.' },
  { icon: Wallet, title: 'Automatic billing', text: 'Invoices built from consultation and tests, 40% follow-up discount, card and mobile banking payment.' },
  { icon: BarChart3, title: 'Full financial suite', text: 'Revenue, expenses, payroll with doctor commission, and month-by-month profit & loss with CSV export.' },
  { icon: Clock, title: 'Analytics & audit', text: 'Busiest-hour heatmaps, doctor utilisation, and a complete audit trail of every sensitive action.' },
];

const roles = [
  { name: 'Patients', points: ['Book a specialist in seconds', 'Track mood & take screenings', 'Chat with your doctor', 'Pay by card, bKash, Nagad or Rocket'] },
  { name: 'Doctors', points: ['Today’s schedule at a glance', 'Full patient records & score trends', 'Instant risk alerts', 'Manage leave & chat with patients'] },
  { name: 'Staff', points: ['Approve appointments', 'Run the lab queue', 'Generate invoices', 'Live notifications'] },
  { name: 'Admins', points: ['Hire staff & run payroll', 'Expenses & profit/loss', 'Operations analytics', 'Audit log'] },
];

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen overflow-hidden bg-white">
      {/* Nav */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-2">
          {user ? (
            <Link to="/app" className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
              Go to dashboard <ArrowRight className="size-4" />
            </Link>
          ) : (<>
            <Link to="/login" className="hidden h-10 items-center rounded-xl px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex">Log in</Link>
            <Link to="/register" className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">Get started</Link>
          </>)}
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-150 w-275 -translate-x-1/2 rounded-full bg-linear-to-br from-brand-200/60 via-indigo-200/40 to-transparent blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-10 sm:px-8 lg:grid-cols-2 lg:pt-16">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
              <Sparkles className="size-3.5" /> Mental health care, managed with care
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
              Calm operations for <span className="bg-linear-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">mental health</span> clinics
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              MindCare brings appointments, prescriptions, lab tests, billing and finances into one place, so your team can focus on patients rather than paperwork.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={user ? '/app' : '/register'} className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700">
                {user ? 'Open dashboard' : 'Book your first visit'} <ArrowRight className="size-4" />
              </Link>
              {!user && <Link to="/login" className="inline-flex h-12 items-center rounded-xl border border-slate-200 bg-white px-6 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Staff & doctor login</Link>}
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              {['4 role-based portals', 'Real-time updates', 'Mood & risk tracking'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-brand-500" />{t}</span>
              ))}
            </div>
          </div>

          {/* Hero visual: mock dashboard */}
          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="absolute -inset-4 rounded-4xl bg-linear-to-br from-brand-400/20 to-indigo-400/20 blur-2xl" />
            <div className="relative rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xl shadow-slate-900/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Today, 9:00 AM</p>
                  <p className="font-display text-lg font-bold">Good morning, Dr. Farhana</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">6 patients</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[['Revenue', '৳48.2k', 'from-brand-500 to-brand-600'], ['Visits', '126', 'from-indigo-500 to-indigo-600'], ['Pending', '9', 'from-amber-400 to-orange-500']].map(([l, v, g]) => (
                  <div key={l} className={`rounded-2xl bg-linear-to-br ${g} p-3 text-white`}>
                    <p className="text-[11px] opacity-80">{l}</p><p className="font-display text-lg font-extrabold">{v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {[['Rahim Uddin', '9:15 AM', 'Follow-up', 'bg-sky-50 text-sky-700'], ['Ayesha Khan', '9:30 AM', 'New patient', 'bg-violet-50 text-violet-700'], ['Karim Hossain', '9:45 AM', 'Therapy', 'bg-emerald-50 text-emerald-700']].map(([n, t, tag, c]) => (
                  <div key={n} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                    <span className="grid size-9 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{n.split(' ').map((w) => w[0]).join('')}</span>
                    <div className="flex-1"><p className="text-sm font-semibold">{n}</p><p className="flex items-center gap-1 text-xs text-slate-500"><Clock className="size-3" />{t}</p></div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${c}`}>{tag}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-16 -left-6 hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 pr-5 shadow-xl sm:flex">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-600"><HeartHandshake className="size-5" /></span>
              <div><p className="text-xs text-slate-500">Payment received</p><p className="text-sm font-bold">৳1,120 via bKash</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-600">Everything in one place</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">From first booking to final receipt</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-6 transition hover:-translate-y-1 hover:shadow-lift">
                <span className="grid size-12 place-items-center rounded-2xl bg-linear-to-br from-brand-50 to-indigo-50 text-brand-600 ring-1 ring-brand-100"><Icon className="size-6" /></span>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-600">Four portals</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Built for everyone in the clinic</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r, i) => (
              <div key={r.name} className="relative overflow-hidden rounded-3xl border border-slate-200 p-6">
                <span className="font-display text-5xl font-extrabold text-slate-100">0{i + 1}</span>
                <h3 className="-mt-4 text-xl font-bold">{r.name}</h3>
                <ul className="mt-4 space-y-2.5">
                  {r.points.map((p) => <li key={p} className="flex gap-2 text-sm text-slate-600"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-500" />{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-4xl bg-linear-to-br from-slate-900 via-slate-900 to-brand-900 px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Taking the first step matters.</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Create a free patient account and book a confidential consultation with one of our specialists.</p>
          <Link to={user ? '/app' : '/register'} className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-slate-900 transition hover:-translate-y-0.5">
            {user ? 'Go to dashboard' : 'Create an account'} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 sm:flex-row sm:px-8">
          <Logo />
          <p>Mental Health Care Administrative & Financial Management System · Academic project · Payments are simulated</p>
        </div>
      </footer>
    </div>
  );
}
