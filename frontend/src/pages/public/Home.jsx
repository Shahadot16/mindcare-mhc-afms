/*
  Landing page, built with taste-skill (kind: service, a clinic) and ui-ux-pro-max checks.
  Deal: hero split · palette cool-white-slate (off-white like a clean consulting room, one calm
  teal) · type red-hat · nav-centre · footer-columns (footer-visit re-dealt: no street address
  given) · close-photo · rhythm surface-pairs · buttons arrow · mark initial · moment
  picture-develops (the notebook photograph in "Between visits").
  Photographs are licensed Wikimedia Commons stock stand-ins until the clinic has its own.
*/
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, MessagesSquare, ClipboardCheck, BellRing, HeartPulse,
  Plus, Stethoscope, Receipt, BarChart3, CalendarCheck, Clock, Check,
} from 'lucide-react';
import Logo from '@/components/layout/Logo';
import DevelopPhoto from '@/components/ui/DevelopPhoto';
import Reveal, { useInView } from '@/components/ui/Reveal';
import { MOODS } from '@/constants/mood';
import { cx } from '@/components/ui';
import { IMG, wrap, useMainAction, PrimaryLink, SecondaryLink, SectionHead, PublicLayout } from '@/components/public/kit';
import { SPECIALISTS, HOME_FAQS, taka } from '@/content/clinic';

const specialists = SPECIALISTS.map((x) => ({ ...x, fee: taka(x.fee) }));

const steps = [
  { title: 'Choose a doctor', text: "Filter by specialty and see each doctor's working days and fee." },
  { title: 'Pick a free slot', text: 'Taken times are greyed out, so no two people get the same slot.' },
  { title: 'Get your notes and bill', text: 'Prescription, test advice and the invoice appear in your portal after the visit.' },
];

const between = [
  { icon: HeartPulse, title: 'Log your mood each day', text: 'A one-minute check-in on mood, sleep and anxiety, charted week by week.' },
  { icon: ClipboardCheck, title: 'Take PHQ-9 and GAD-7 screenings', text: 'Standard depression and anxiety questionnaires, scored as soon as you finish.' },
  { icon: MessagesSquare, title: 'Message your doctor', text: 'Ask a question before your next appointment instead of waiting for it.' },
  { icon: BellRing, title: 'Alert your doctor to risk', text: 'If a screening shows thoughts of self-harm, your doctor is told at once.' },
];

/* ---------- Hero (split) ---------- */
function Hero({ heroRef }) {
  const main = useMainAction();
  return (
    <section ref={heroRef} aria-labelledby="hero-title" className="pt-[72px]">
      <div className={cx(wrap, 'grid items-start gap-8 pb-10 pt-6 sm:gap-10 sm:pb-16 sm:pt-12 lg:min-h-[calc(100svh-72px)] lg:grid-cols-12 lg:gap-6 lg:pb-16 lg:pt-12')}>
        <div className="flex flex-col lg:col-span-5">
          <p className="inline-flex w-fit items-center gap-2 text-sm font-medium text-brand-700 animate-enter">
            <span className="size-1.5 rounded-full bg-brand-500" aria-hidden />
            Clinic and video visits, Saturday to Thursday
          </p>
          <h1 id="hero-title" className="mt-4 text-[40px] font-normal leading-[1.03] tracking-[-0.035em] text-ink animate-enter [animation-delay:80ms] sm:text-[56px] xl:text-[72px] xl:leading-[1.02]">
            Mental health clinic with online booking
          </h1>
          <p className="mt-4 max-w-[42ch] text-[17px] leading-relaxed sm:mt-6 sm:text-lg text-slate-600 animate-enter [animation-delay:160ms] sm:text-xl sm:leading-[1.5]">
            See a psychiatrist, psychologist or addiction specialist. Pick a free 15-minute slot, come to the clinic or join by video, and pay from your phone.
          </p>
          <div className="mt-6 flex flex-col gap-3 animate-enter [animation-delay:240ms] sm:mt-8 sm:flex-row">
            <PrimaryLink to={main.to}>{main.label}</PrimaryLink>
            <SecondaryLink href="#specialists">See specialists and fees</SecondaryLink>
          </div>
          <p className="mt-6 text-[15px] text-slate-500 animate-enter [animation-delay:320ms] sm:mt-8">
            Consultations from <strong className="font-semibold text-ink">৳1,000</strong> · 40% off a follow-up within two months
          </p>
        </div>

        <div className="relative lg:col-span-6 lg:col-start-7 animate-enter [animation-delay:200ms]">
          <div className="photo-frame h-[240px] rounded-3xl bg-surface sm:h-[420px] lg:h-[clamp(520px,calc(100svh-72px-112px),760px)]">
            <img src={`${IMG}/photo-f200472104-960.jpg`} srcSet={`${IMG}/photo-f200472104-500.jpg 500w, ${IMG}/photo-f200472104-960.jpg 960w`}
              sizes="(max-width: 1023px) 100vw, 46vw" width="960" height="1433" fetchPriority="high" decoding="async"
              alt="A doctor talking with a patient on a video call from her desk"
              className="size-full object-cover object-[50%_35%]" data-source="stand-in" />
          </div>
          <div className="absolute bottom-5 left-5 w-[min(300px,calc(100%-40px))] rounded-2xl border border-slate-200 bg-white p-4 shadow-lift animate-float">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="relative grid size-2.5 place-items-center" aria-hidden>
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-breathe" />
                <span className="relative size-2.5 rounded-full bg-emerald-500" />
              </span>
              Video consultations
            </p>
            <p className="mt-1 text-sm text-slate-500">Evenings, 6 PM to 10 PM, 30 minutes each</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Specialists (services-list beside a photograph) ---------- */
function Specialists() {
  const main = useMainAction();
  return (
    <section aria-labelledby="specialists" className="scroll-mt-[72px] py-20 lg:py-24 lg:flex lg:min-h-[calc(100svh-72px)] lg:flex-col lg:justify-center">
      <div className={cx(wrap, 'grid items-start gap-12 lg:grid-cols-12 lg:gap-6')}>
        <Reveal className="photo-frame order-2 h-[360px] rounded-3xl bg-surface sm:h-[480px] lg:col-span-6 lg:col-start-1 lg:row-start-1 lg:h-[720px]">
          <img src={`${IMG}/photo-f191715177.jpg`} srcSet={`${IMG}/photo-f191715177-500.jpg 500w, ${IMG}/photo-f191715177-960.jpg 960w, ${IMG}/photo-f191715177.jpg 1280w`}
            sizes="(max-width: 1023px) 100vw, 46vw" width="1280" height="853" loading="lazy" decoding="async"
            alt="A young woman at a table holding her face in her hands" className="size-full object-cover object-[60%_50%]" data-source="stand-in" />
        </Reveal>
        <Reveal delay={120} className="order-1 lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:pl-12">
          <SectionHead id="specialists" title="Specialists and fees." muted="Every clinic visit is 15 minutes." />
          <ul className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {specialists.map(({ icon: Icon, name, text, fee }) => (
              <li key={name}>
                <Link to={main.to} aria-label={`Book a ${name.toLowerCase()}, ${fee} a visit`}
                  className="group -mx-3 flex gap-4 rounded-2xl px-3 py-6 transition-colors duration-300 hover:bg-white sm:-mx-4 sm:px-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 transition duration-300 group-hover:scale-105 group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="text-lg font-medium tracking-tight sm:text-xl">{name}</h3>
                      <p className="flex items-center font-display text-lg text-ink tabular-nums">{fee} <span className="ml-1 text-sm text-slate-500">a visit</span><ArrowRight className="hidden size-4 text-brand-700 opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:opacity-100 group-focus-visible:opacity-100 lg:block lg:-ml-4 lg:w-4" aria-hidden /></p>
                    </div>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{text}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 lg:hidden">
                      Book this specialist <ArrowRight className="size-3.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- How booking works (steps beside the real slot picker) ---------- */
const slots = ['14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45'];
const taken = new Set(['14:15', '14:30', '15:45', '16:30']);
const days = [['Sat', 'Free'], ['Sun', 'Free'], ['Mon', 'Off'], ['Tue', 'Free'], ['Wed', 'Free']];

function SlotPicker({ day, setDay, pick, setPick, done, setDone }) {
  const main = useMainAction();
  return (
    <div data-ui="slot-picker" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lift sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-brand-100 font-display font-bold text-brand-800" aria-hidden>CP</span>
        <div>
          <p className="font-semibold text-ink">Clinical psychologist</p>
          <p className="text-sm text-slate-500">৳1,000 a visit · 2 PM to 8 PM</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-5 gap-2" role="radiogroup" aria-label="Day">
        {days.map(([d, s], i) => {
          const off = s === 'Off';
          return (
            <button key={d} type="button" disabled={off} onClick={() => { setDay(i); setDone(false); }} role="radio" aria-checked={day === i}
              className={cx('min-h-14 rounded-xl border text-sm font-semibold transition',
                off ? 'cursor-not-allowed border-dashed border-slate-200 text-slate-300'
                  : day === i ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-brand-50')}>
              {d}<span className={cx('block text-[11px] font-medium', day === i ? 'text-white' : off ? 'text-slate-400' : 'text-slate-500')}>{s}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Time">
        {slots.map((t) => {
          const busy = taken.has(t);
          return (
            <button key={t} type="button" disabled={busy} onClick={() => { setPick(t); setDone(false); }} role="radio" aria-checked={pick === t}
              className={cx('min-h-11 rounded-xl border text-sm font-semibold tabular-nums transition',
                busy ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through'
                  : pick === t ? 'border-brand-600 bg-brand-50 text-brand-800 ring-2 ring-brand-200' : 'border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-brand-50')}>
              {t}
            </button>
          );
        })}
      </div>
      <div className={cx('mt-6 flex min-h-[76px] flex-wrap items-center justify-between gap-3 rounded-2xl p-4 transition-colors duration-500', done ? 'bg-emerald-50' : 'bg-surface')} aria-live="polite">
        {done ? (
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-emerald-800 animate-pop">
            <span className="grid size-6 place-items-center rounded-full bg-emerald-600 text-white"><Check className="size-3.5" aria-hidden /></span>
            {days[day][0]} at {pick} is held for you. <Link to={main.to} className="link-draw font-semibold">Create an account to keep it</Link>
          </p>
        ) : (<>
          <p className="flex items-center gap-2 text-sm text-slate-600"><Clock className="size-4 text-brand-600" aria-hidden />{days[day][0]}, {pick} to {slots[slots.indexOf(pick) + 1] || '17:00'}</p>
          <button type="button" onClick={() => setDone(true)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-brand-700 active:translate-y-0 active:scale-[0.98]">
            <CalendarCheck className="size-4" aria-hidden />Confirm
          </button>
        </>)}
      </div>
    </div>
  );
}

function HowItWorks() {
  const [day, setDay] = useState(1);
  const [pick, setPick] = useState('15:15');
  const [done, setDone] = useState(false);
  const [touched, setTouched] = useState(0); // 0 nothing yet, 1 a day picked, 2 a time picked
  const stage = done ? 3 : touched;
  const picker = {
    day, pick, done, setDone,
    setDay: (v) => { setDay(v); setTouched((t) => Math.max(t, 1)); },
    setPick: (v) => { setPick(v); setTouched(2); },
  };
  return (
    <section aria-labelledby="how" className="scroll-mt-[72px] bg-surface py-20 lg:py-24 lg:flex lg:min-h-[calc(100svh-72px)] lg:flex-col lg:justify-center">
      <div className={cx(wrap, 'grid items-start gap-12 lg:grid-cols-12 lg:gap-6')}>
        <Reveal className="lg:col-span-5">
          <SectionHead id="how" title="How booking works" lead="Three steps, all in the patient portal. Try the picker." />
          <ol className="mt-10 space-y-8">
            {steps.map((s, i) => (
              <li key={s.title} className={cx('flex gap-5 transition-opacity duration-500', stage > 0 && stage < i + 1 && 'opacity-55')}>
                <span className={cx('grid size-11 shrink-0 place-items-center rounded-full border font-display text-lg transition-colors duration-500',
                  stage >= i + 1 ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-ink')} aria-hidden>
                  {stage >= i + 1 ? <Check className="size-5 animate-pop" /> : i + 1}
                </span>
                <div>
                  <h3 className="text-xl font-medium tracking-tight">{s.title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
        <Reveal delay={120} className="lg:col-span-6 lg:col-start-7"><SlotPicker {...picker} /></Reveal>
      </div>
    </section>
  );
}

/* ---------- Between visits (moment: the photograph develops) ---------- */
function MoodCheck() {
  const [mood, setMood] = useState(null);
  const m = mood && MOODS[mood - 1];
  return (
    <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lift backdrop-blur sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[330px]">
      <p className="text-sm font-semibold text-ink">How are you feeling today?</p>
      <div className="mt-3 flex justify-between gap-1" role="radiogroup" aria-label="Mood">
        {MOODS.map((x) => (
          <button key={x.value} type="button" role="radio" aria-checked={mood === x.value} aria-label={x.label} onClick={() => setMood(x.value)}
            className={cx('grid size-11 place-items-center rounded-xl text-2xl transition duration-200 hover:-translate-y-0.5 hover:bg-surface',
              mood === x.value ? 'scale-110 bg-brand-50 ring-2 ring-brand-500' : mood ? 'opacity-50' : '')}>
            <span aria-hidden>{x.emoji}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 min-h-10 text-xs leading-relaxed text-slate-600" aria-live="polite">
        {m ? <span className="inline-block animate-pop">Saved as {m.label.toLowerCase()}. Your doctor sees the trend before your visit.</span> : 'Tap a face. In the portal this is your daily one-minute check-in.'}
      </p>
    </div>
  );
}

function BetweenVisits() {
  return (
    <section aria-labelledby="between" className="scroll-mt-[72px] py-20 lg:py-24 lg:flex lg:min-h-[calc(100svh-72px)] lg:flex-col lg:justify-center">
      <div className={wrap}>
        <Reveal>
          <SectionHead id="between" title="Support between visits" lead="Your portal keeps track of how you are doing, and your doctor sees it too." />
        </Reveal>
        <div className="mt-12 grid items-start gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="relative lg:col-span-6 lg:col-start-1 lg:row-start-1">
          <DevelopPhoto src={`${IMG}/photo-f198049049.jpg`}
            srcSet={`${IMG}/photo-f198049049-500.jpg 500w, ${IMG}/photo-f198049049-960.jpg 960w, ${IMG}/photo-f198049049.jpg 1280w`}
            sizes="(max-width: 1023px) 100vw, 50vw" width="1280" height="853"
            alt="A smiling woman checking her phone"
            className="h-[400px] rounded-3xl bg-white sm:h-[440px] lg:h-[520px]" data-source="stand-in" />
            <MoodCheck />
          </div>
          <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:pl-6">
            {between.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={i * 90} className="group">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-brand-600 group-hover:text-white"><Icon className="size-5" aria-hidden /></span>
                <h3 className="mt-4 text-lg font-medium tracking-tight">{title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- Clinic team (the clinic's own portal, in one app window) ---------- */
const today = [
  ['09:15', 'Rahim Uddin', 'Follow-up', 'bg-sky-50 text-sky-800 ring-sky-200'],
  ['09:30', 'Ayesha Khan', 'First visit', 'bg-amber-50 text-amber-800 ring-amber-200'],
  ['09:45', 'Karim Hossain', 'Video', 'bg-brand-50 text-brand-800 ring-brand-200'],
];
const bars = [38, 52, 46, 61, 58, 72, 66];

function AppFrame() {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} data-ui="app-frame" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lift">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3" aria-hidden>
        <span className="size-3 rounded-full bg-slate-300" /><span className="size-3 rounded-full bg-slate-300" /><span className="size-3 rounded-full bg-slate-300" />
        <span className="ml-3 rounded-md bg-white px-3 py-1 text-xs text-slate-500 ring-1 ring-slate-200">MindCare · Doctor dashboard</span>
      </div>
      <div className="grid sm:grid-cols-[180px_1fr]">
        <div className="hidden flex-col gap-1 bg-ink p-4 text-sm text-slate-300 sm:flex" aria-hidden>
          <Logo light compact className="mb-4" />
          {[[CalendarCheck, 'Dashboard', true], [Stethoscope, 'Appointments'], [MessagesSquare, 'Messages'], [Receipt, 'Billing'], [BarChart3, 'Reports']].map(([I, l, a]) => (
            <span key={l} className={cx('flex items-center gap-2.5 rounded-lg px-2.5 py-2', a && 'bg-white/10 text-white')}><I className="size-4" />{l}</span>
          ))}
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-end justify-between">
            <div><p className="text-xs text-slate-500">Today</p><p className="font-display text-lg font-semibold text-ink">Dr. Farhana Rahman</p></div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">3 patients</span>
          </div>
          <ul className="space-y-2">
            {today.map(([t, n, tag, c]) => (
              <li key={n} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition duration-200 hover:border-brand-200 hover:bg-brand-50/50">
                <span className="w-11 font-display text-sm font-semibold tabular-nums text-ink">{t}</span>
                <span className="flex-1 truncate text-sm font-medium text-slate-700">{n}</span>
                <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', c)}>{tag}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs text-slate-500">Revenue, last 7 days</p>
            <div className="mt-3 flex h-20 items-end gap-2" aria-hidden>
              {bars.map((h, i) => <span key={i} className={cx('flex-1 rounded-t-md transition-[height] duration-700 ease-out', i === bars.length - 1 ? 'bg-brand-600' : 'bg-brand-200')} style={{ height: inView ? `${h}%` : '4%', transitionDelay: `${150 + i * 70}ms` }} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const teams = [
  ['Doctors', "Today's list, full patient records, prescriptions and score trends."],
  ['Front desk', 'Approvals, the lab queue and invoices, with live notifications.'],
  ['Accounts', 'Revenue, expenses, payroll and a monthly profit and loss report.'],
];

function ClinicTeam() {
  return (
    <section aria-labelledby="clinic-team" className="bg-surface py-20 lg:py-24 lg:flex lg:min-h-[calc(100svh-72px)] lg:flex-col lg:justify-center">
      <div className={cx(wrap, 'grid items-start gap-12 lg:grid-cols-12 lg:gap-6')}>
        <Reveal delay={120} className="order-2 lg:col-span-6 lg:col-start-7 lg:row-start-1"><AppFrame /></Reveal>
        <Reveal className="order-1 lg:col-span-5 lg:col-start-1 lg:row-start-1">
          <SectionHead id="clinic-team" title="One system for the clinic team." />
          <dl className="mt-8 space-y-5">
            {teams.map(([t, d]) => (
              <div key={t} className="border-t border-slate-200 pt-4">
                <dt className="font-semibold text-ink">{t}</dt>
                <dd className="mt-0.5 text-[15px] leading-relaxed text-slate-600">{d}</dd>
              </div>
            ))}
          </dl>
          <Link to="/login" className="link-draw mt-8 inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-700">
            Log in to the staff portal <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Questions ---------- */
function Questions() {
  return (
    <section aria-labelledby="questions" className="scroll-mt-[72px] py-20 lg:py-24 lg:flex lg:min-h-[calc(100svh-72px)] lg:flex-col lg:justify-center">
      <div className={cx(wrap, 'grid items-start gap-10 lg:grid-cols-12 lg:gap-6')}>
        <Reveal className="lg:col-span-5"><SectionHead id="questions" title="Questions before your first visit" /></Reveal>
        <Reveal delay={120} className="divide-y divide-slate-200 border-y border-slate-200 lg:col-span-6 lg:col-start-7">
          {HOME_FAQS.map(({ q, a }, i) => (
            <details key={q} className="group" open={i === 0}>
              <summary className="flex min-h-16 list-none items-center justify-between gap-6 py-5 text-lg font-medium text-ink transition hover:text-brand-700 [&::-webkit-details-marker]:hidden">
                {q}
                <Plus className="size-5 shrink-0 text-slate-400 transition duration-300 group-open:rotate-45 group-open:text-brand-600" aria-hidden />
              </summary>
              <p className="-mt-1 max-w-[62ch] pb-6 text-[15px] leading-relaxed text-slate-600 group-open:animate-fade-up">{a}</p>
            </details>
          ))}
          <Link to="/faq" className="link-draw mt-6 inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-700">
            See all questions <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Close (close-photo) and footer (footer-columns) ---------- */
function Closing() {
  const main = useMainAction();
  return (
    <section aria-labelledby="book" className="bg-ink pb-16 text-slate-300 lg:pb-20">
      <div className={cx(wrap, 'pt-20 lg:pt-28')}>
        <Reveal className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 id="book" className="scroll-mt-28 text-[34px] font-normal leading-[1.08] tracking-[-0.025em] text-white sm:text-[52px]">Book your first consultation.</h2>
            <p className="mt-4 text-lg text-slate-400">Create a free patient account, choose a doctor and pick a time that suits you.</p>
          </div>
          <PrimaryLink to={main.to} className="shrink-0">{main.label}</PrimaryLink>
        </Reveal>
        <Reveal delay={100} className="photo-frame mt-12 h-[260px] rounded-3xl sm:h-[380px] lg:h-[460px]">
          <img src={`${IMG}/photo-f192387473.jpg`} srcSet={`${IMG}/photo-f192387473-500.jpg 500w, ${IMG}/photo-f192387473-960.jpg 960w, ${IMG}/photo-f192387473.jpg 1280w`}
            sizes="(max-width: 1279px) 100vw, 1280px" width="1280" height="853" loading="lazy" decoding="async"
            alt="A woman stretching happily in a cosy armchair by a window" className="size-full object-cover object-[50%_45%]" data-source="stand-in" />
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Phone action bar: appears once the hero's button has scrolled away ---------- */
function PhoneBar({ heroRef }) {
  const main = useMainAction();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = heroRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [heroRef]);
  return (
    <div className={cx('fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-ground/95 p-3 backdrop-blur transition-transform duration-300 sm:hidden',
      show ? 'translate-y-0' : 'translate-y-full')} aria-hidden={!show}>
      <PrimaryLink to={main.to} className="w-full" tabIndex={show ? 0 : -1}>{main.label}</PrimaryLink>
    </div>
  );
}

export default function Home() {
  const heroRef = useRef(null);
  return (
    <PublicLayout title="Mental health clinic with online booking">
      <Hero heroRef={heroRef} />
      <Specialists />
      <HowItWorks />
      <BetweenVisits />
      <ClinicTeam />
      <Questions />
      <Closing />
      <PhoneBar heroRef={heroRef} />
    </PublicLayout>
  );
}
