import { Link } from 'react-router-dom';
import { Phone, Hospital, Users, Wind, CalendarCheck, ArrowRight, HeartHandshake } from 'lucide-react';
import { PublicLayout, wrap, useMainAction } from '@/components/public/kit';
import Reveal from '@/components/ui/Reveal';
import { cx } from '@/components/ui';
import { CLINIC } from '@/content/clinic';

const now = [
  { icon: Phone, title: `Call ${CLINIC.emergency}`, text: 'If you might hurt yourself or someone else, or someone is in danger, call the national emergency number now.' },
  { icon: Hospital, title: 'Go to a hospital emergency department', text: 'If you can get there safely, go to the nearest hospital and tell them you are in crisis. Ask someone to go with you.' },
  { icon: Users, title: 'Stay with someone you trust', text: 'Tell a family member, friend or neighbour how you feel and ask them to stay with you until help arrives.' },
];

const helper = [
  'Ask them directly how they are feeling. Asking about suicide does not put the idea in their head.',
  'Listen without judging, and take what they say seriously.',
  'Stay with them, and remove anything they could use to hurt themselves if it is safe to do so.',
  `Call ${CLINIC.emergency} if they are in immediate danger.`,
];

export default function GetHelp() {
  const main = useMainAction();
  return (
    <PublicLayout title="Get help now">
      {/* Urgent header */}
      <section className="bg-rose-50 pt-[72px]">
        <div className={cx(wrap, 'py-12 sm:py-16 lg:py-20')}>
          <p className="text-sm font-semibold text-rose-700 animate-enter">Get help now</p>
          <h1 className="mt-2 max-w-3xl text-[36px] font-normal leading-[1.05] tracking-[-0.03em] text-rose-950 animate-enter [animation-delay:80ms] sm:text-[52px] lg:text-[60px]">
            If you are in danger right now, call {CLINIC.emergency}.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-rose-950/75 animate-enter [animation-delay:160ms] sm:text-xl">
            MindCare is not an emergency service. Our messages and screenings are not watched around the clock, so please do not wait for a reply from us.
          </p>
          <div className="mt-8 flex flex-col gap-3 animate-enter [animation-delay:240ms] sm:flex-row">
            <a href={`tel:${CLINIC.emergency}`} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-rose-600 px-7 text-lg font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-rose-700 active:translate-y-0">
              <Phone className="size-5" aria-hidden /> Call {CLINIC.emergency}
            </a>
          </div>
        </div>
      </section>

      {/* Right now */}
      <section className="py-16 lg:py-24">
        <div className={wrap}>
          <h2 className="text-[30px] font-normal tracking-tight sm:text-[40px]">What to do right now</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {now.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 80} className="rounded-3xl border border-slate-200 bg-white p-6">
                <span className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100"><Icon className="size-5" aria-hidden /></span>
                <h3 className="mt-5 text-lg font-medium tracking-tight">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Breathing + helping someone */}
      <section className="bg-surface py-16 lg:py-24">
        <div className={cx(wrap, 'grid gap-6 lg:grid-cols-2')}>
          <Reveal className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-2xl font-normal tracking-tight"><Wind className="size-6 text-brand-600" aria-hidden />While you wait</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">Slow breathing can take the edge off panic. Follow the circle: breathe in as it grows, out as it shrinks.</p>
            <div className="mt-8 grid place-items-center py-6" aria-hidden>
              <div className="relative grid size-44 place-items-center">
                <span className="absolute inset-0 rounded-full bg-brand-100 animate-[breathe-slow_10s_ease-in-out_infinite]" />
                <span className="relative font-display text-lg text-brand-800">Breathe</span>
              </div>
            </div>
            <p className="text-center text-sm text-slate-500">In for 4 seconds · hold for 1 · out for 5</p>
          </Reveal>
          <Reveal delay={100} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-2xl font-normal tracking-tight"><HeartHandshake className="size-6 text-brand-600" aria-hidden />Worried about someone else?</h2>
            <ol className="mt-5 space-y-4">
              {helper.map((t, i) => (
                <li key={t} className="flex gap-4 text-[15px] leading-relaxed text-slate-700">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">{i + 1}</span>{t}
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* When it is not an emergency */}
      <section className="py-16 lg:py-24">
        <div className={cx(wrap, 'flex flex-col gap-6 rounded-3xl bg-ink p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between')}>
          <div className="max-w-2xl">
            <h2 className="text-[28px] font-normal tracking-tight text-white sm:text-[36px]">Not in danger, but struggling?</h2>
            <p className="mt-3 text-lg text-slate-300">You do not have to wait until things get worse. Book a consultation with a psychiatrist or psychologist.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to={main.to} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 font-semibold text-ink transition hover:-translate-y-px hover:bg-brand-50">
              <CalendarCheck className="size-4" aria-hidden />{main.label}
            </Link>
            <Link to="/services" className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-white/20 px-6 font-semibold text-white transition hover:bg-white/10">
              See specialists <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
