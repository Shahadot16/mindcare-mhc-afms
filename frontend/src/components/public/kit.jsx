/* Shared pieces for the public site: nav, footer, page header, buttons and the page layout. */
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUp, ChevronRight, Clock, LifeBuoy, Mail, MapPin, Menu, X } from 'lucide-react';
import Logo from '@/components/layout/Logo';
import { useAuth } from '@/context/AuthContext';
import { cx } from '@/components/ui';
import { CLINIC, HOURS, PAYMENT_METHODS } from '@/content/clinic';

export const IMG = '/assets/img';
export const wrap = 'wrap mx-auto w-full max-w-[1344px] px-5 sm:px-8';

export function useMainAction() {
  const { user } = useAuth();
  if (!user) return { to: '/register', label: 'Book a consultation' };
  if (user.role === 'Patient') return { to: '/app/doctors', label: 'Book a consultation' };
  return { to: '/app', label: 'Open your dashboard' };
}

export function PrimaryLink({ to, children, className, size = 'lg', ...rest }) {
  return (
    <Link to={to} {...rest} className={cx(
      'btn-arrow inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 font-semibold text-white shadow-sm shadow-brand-900/15 transition duration-200 hover:-translate-y-px hover:bg-brand-700 active:translate-y-0 active:scale-[0.98]',
      size === 'lg' ? 'min-h-12 px-6 text-base' : 'min-h-11 px-4 text-sm',
      className
    )}>
      {children} <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
}

export function SecondaryLink({ href, to, children, className }) {
  const cls = cx('inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-base font-semibold text-ink transition duration-200 hover:-translate-y-px hover:border-slate-400 active:translate-y-0 active:scale-[0.98]', className);
  return to ? <Link to={to} className={cls}>{children}</Link> : <a href={href} className={cls}>{children}</a>;
}

export function SectionHead({ id, title, muted, lead, className, light }) {
  return (
    <div className={cx('max-w-2xl', className)}>
      <h2 id={id} className={cx('scroll-mt-28 text-[32px] font-normal leading-[1.08] tracking-[-0.025em] sm:text-[44px]', light && 'text-white')}>
        {title} {muted && <span className={light ? 'text-slate-400' : 'text-slate-500'}>{muted}</span>}
      </h2>
      {lead && <p className={cx('mt-4 text-lg leading-relaxed', light ? 'text-slate-300' : 'text-slate-600')}>{lead}</p>}
    </div>
  );
}

/* ---------- Nav ---------- */
export const NAV_LINKS = [['/services', 'Services and fees'], ['/about', 'About'], ['/faq', 'FAQ'], ['/contact', 'Contact']];

export function PublicNav() {
  const { user } = useAuth();
  const main = useMainAction();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkCls = ({ isActive }) => cx(
    'relative rounded-lg px-3 py-2 text-[15px] font-medium transition hover:bg-surface hover:text-ink xl:px-3.5',
    'after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:origin-left after:rounded-full after:bg-brand-600 after:transition-transform after:duration-300',
    isActive ? 'text-ink after:scale-x-100' : 'text-slate-600 after:scale-x-0'
  );

  return (
    <header className={cx('nav fixed inset-x-0 top-0 z-40 border-b bg-ground/95 backdrop-blur-md transition-shadow duration-300',
      scrolled ? 'border-slate-200 shadow-[0_6px_24px_-12px_rgb(31_48_56/0.18)]' : 'border-transparent')}>
      <div className={cx(wrap, 'flex h-[72px] items-center gap-4')}>
        <Link to="/" className="rounded-xl" aria-label="MindCare home"><Logo /></Link>
        <nav aria-label="Main" className="mx-auto hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map(([to, label]) => <NavLink key={to} to={to} className={linkCls}>{label}</NavLink>)}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          <Link to="/get-help" className="hidden min-h-11 items-center gap-1.5 rounded-xl px-3 text-[15px] font-semibold text-rose-700 transition hover:bg-rose-50 xl:inline-flex">
            <LifeBuoy className="size-4" aria-hidden /> Get help now
          </Link>
          {!user && <Link to="/login" className="hidden min-h-11 items-center rounded-xl px-3.5 text-[15px] font-semibold text-slate-700 transition hover:bg-surface sm:inline-flex">Log in</Link>}
          <span className="hidden sm:block"><PrimaryLink to={main.to} size="md">{main.label}</PrimaryLink></span>
          <button onClick={() => setOpen(true)} className="grid size-11 place-items-center rounded-xl text-ink transition hover:bg-surface lg:hidden" aria-label="Open menu" aria-expanded={open}>
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ground animate-[fade-up_.25s_ease-out_both] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className={cx(wrap, 'flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200/80')}>
            <Logo />
            <button onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-xl hover:bg-surface" aria-label="Close menu"><X className="size-5" /></button>
          </div>
          <nav aria-label="Menu" className={cx(wrap, 'flex flex-1 flex-col gap-1 py-6')}>
            <NavLink to="/" end className={({ isActive }) => cx('rounded-xl px-2 py-3 font-display text-2xl hover:bg-surface', isActive ? 'text-brand-700' : 'text-ink')}>Home</NavLink>
            {NAV_LINKS.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => cx('rounded-xl px-2 py-3 font-display text-2xl hover:bg-surface', isActive ? 'text-brand-700' : 'text-ink')}>{label}</NavLink>
            ))}
            <Link to="/get-help" className="mt-2 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-3 font-semibold text-rose-700"><LifeBuoy className="size-5" aria-hidden />Get help now</Link>
            <div className="mt-auto grid gap-3 pt-8">
              {!user && <SecondaryLink to="/login">Log in</SecondaryLink>}
              <PrimaryLink to={main.to}>{main.label}</PrimaryLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ---------- Footer ---------- */
const FOOTER_COLS = [
  ['Care', [['/services', 'Services and fees'], ['/services#tests', 'Tests and screenings'], ['/services#visits', 'Clinic and video visits'], ['/#how', 'How booking works'], ['/get-help', 'Get help now']]],
  ['Patients', [['/register', 'Create an account'], ['/login', 'Log in'], ['/app', 'Patient portal'], ['/forgot-password', 'Reset your password'], ['/faq', 'Questions']]],
  ['Clinic', [['/about', 'About MindCare'], ['/about#doctors', 'Our doctors'], ['/contact', 'Contact'], ['/login', 'Staff portal']]],
  ['Legal', [['/privacy', 'Privacy policy'], ['/terms', 'Terms and conditions'], ['/credits.html', 'Photo credits']]],
];

const footLink = 'link-draw inline-flex min-h-10 items-center text-[15px] text-slate-400 transition-colors hover:text-white';

export function PublicFooter() {
  return (
    <footer className="bg-ink text-slate-300">
      {/* Urgent help strip */}
      <div className="border-b border-white/10">
        <div className={cx(wrap, 'flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between')}>
          <p className="flex items-start gap-3 text-[15px] text-slate-300">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-rose-500/15 text-rose-300"><LifeBuoy className="size-4" aria-hidden /></span>
            <span><strong className="font-semibold text-white">In danger right now?</strong> MindCare is not an emergency service. Call <a href={`tel:${CLINIC.emergency}`} className="font-semibold text-white underline decoration-rose-300 underline-offset-4">{CLINIC.emergency}</a> or go to the nearest hospital.</span>
          </p>
          <Link to="/get-help" className="inline-flex min-h-11 w-fit shrink-0 items-center gap-1.5 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white transition hover:bg-white/10">
            Get help now <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>

      <div className={wrap}>
        <div className="grid gap-x-6 gap-y-12 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:py-16">
          <div className="sm:col-span-2 lg:col-span-4">
            <Link to="/" className="inline-block rounded-xl"><Logo light /></Link>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-slate-400">Psychiatry, psychology and addiction care, in the clinic or by video. Book online, pay from your phone and keep every note in one portal.</p>
            <ul className="mt-6 space-y-3 text-[15px]">
              <li className="flex gap-3"><Clock className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden />
                <span className="text-slate-300">{HOURS.filter(([, , k]) => k).map(([d, h, k]) => <span key={d} className="block">{d}: <span className="text-slate-400">{h} · {k.toLowerCase()}</span></span>)}<span className="block text-slate-400">Friday closed</span></span>
              </li>
              <li className="flex gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden /><a href={`mailto:${CLINIC.email}`} className="link-draw text-slate-300 hover:text-white">{CLINIC.email}</a></li>
              <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden /><span>{CLINIC.city}</span></li>
            </ul>
          </div>

          {FOOTER_COLS.map(([title, links]) => (
            <div key={title} className="lg:col-span-2">
              <p className="font-semibold text-white">{title}</p>
              <ul className="mt-3">
                {links.map(([href, label]) => (
                  <li key={label}>
                    {href.endsWith('.html') ? <a href={href} className={footLink}>{label}</a> : <Link to={href} className={footLink}>{label}</Link>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-400">We accept</span>
            {PAYMENT_METHODS.map((m) => <span key={m} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300 ring-1 ring-inset ring-white/10">{m}</span>)}
          </div>
          <div className="flex flex-col gap-1 text-sm text-slate-400 sm:flex-row sm:items-center sm:gap-4">
            <p>© {new Date().getFullYear()} {CLINIC.name} · Academic project; payments are simulated</p>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-xl px-2 font-semibold text-slate-300 transition hover:text-white">
              <ArrowUp className="size-4" aria-hidden /> Back to top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Page header for inner pages ---------- */
export function PageHero({ eyebrow, title, lead, crumb, children, aside }) {
  return (
    <section className="border-b border-slate-200/70 bg-surface pt-[72px]">
      <div className={cx(wrap, 'grid gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:items-end lg:gap-6 lg:py-20')}>
        <div className={cx('animate-enter', aside ? 'lg:col-span-7' : 'lg:col-span-9')}>
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-slate-500">
            <Link to="/" className="link-draw hover:text-ink">Home</Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="text-ink" aria-current="page">{crumb || title}</span>
          </nav>
          {eyebrow && <p className="text-sm font-semibold text-brand-700">{eyebrow}</p>}
          <h1 className="mt-2 text-[38px] font-normal leading-[1.05] tracking-[-0.03em] sm:text-[52px] lg:text-[60px]">{title}</h1>
          {lead && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">{lead}</p>}
          {children}
        </div>
        {aside && <div className="animate-enter [animation-delay:120ms] lg:col-span-5">{aside}</div>}
      </div>
    </section>
  );
}

/* ---------- Closing band: book a consultation ---------- */
export function CtaBand({ title = 'Book your first consultation.', text = 'Create a free patient account, choose a doctor and pick a time that suits you.' }) {
  const main = useMainAction();
  return (
    <section className="bg-ink">
      <div className={cx(wrap, 'flex flex-col gap-8 py-16 lg:flex-row lg:items-end lg:justify-between lg:py-20')}>
        <div className="max-w-2xl">
          <h2 className="text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-white sm:text-[44px]">{title}</h2>
          <p className="mt-4 text-lg text-slate-400">{text}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PrimaryLink to={main.to} className="shrink-0">{main.label}</PrimaryLink>
          <Link to="/contact" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-6 font-semibold text-white transition hover:bg-white/10">Contact the clinic</Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- Layout: skip link, nav, page, footer; scrolls to top or to #hash on navigation ---------- */
export function PublicLayout({ title, children, footer = true }) {
  const { pathname, hash } = useLocation();
  useEffect(() => { if (title) document.title = `${title} · MindCare`; }, [title]);
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return (
    <div id="top" className="min-h-screen bg-ground">
      <a href="#main" className="sr-only z-[60] rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <PublicNav />
      <main id="main">{children}</main>
      {footer && <PublicFooter />}
    </div>
  );
}

