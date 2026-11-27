import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, ClipboardCheck, ShieldCheck, Video, Clock, Stethoscope } from 'lucide-react';
import { PublicLayout, PageHero, SectionHead, CtaBand, IMG, wrap } from '@/components/public/kit';
import Reveal from '@/components/ui/Reveal';
import { Avatar, cx } from '@/components/ui';
import { DOCTORS, SPECIALISTS, taka } from '@/content/clinic';

const values = [
  { icon: Stethoscope, title: 'Seen by a specialist', text: 'Every visit is with a psychiatrist, psychologist or addiction specialist, never a general screening desk.' },
  { icon: ClipboardCheck, title: 'Progress you can see', text: 'PHQ-9 and GAD-7 screenings and daily mood check-ins are charted, so you and your doctor see the trend.' },
  { icon: ShieldCheck, title: 'Private by design', text: 'Only your care team opens your record, and every approval, change and payment is written to an audit log.' },
  { icon: Video, title: 'Care that fits your day', text: 'Come to the clinic or join from home by video in the evening, whichever is easier for you.' },
];

const facts = [
  ['4', 'specialties under one roof'],
  ['15 min', 'clinic visits, 30 min by video'],
  ['6 days', 'a week, Saturday to Thursday'],
  ['40%', 'off a follow-up within two months'],
];

export default function About() {
  return (
    <PublicLayout title="About">
      <PageHero
        eyebrow="About MindCare"
        crumb="About"
        title="A mental health clinic that is easy to reach"
        lead="MindCare brings psychiatry, psychology and addiction care together, with online booking, video visits and one portal for every note, prescription and bill."
        aside={(
          <div className="photo-frame h-[280px] rounded-3xl sm:h-[360px] lg:h-[400px]">
            <img src={`${IMG}/photo-f200472089-960.jpg`} srcSet={`${IMG}/photo-f200472089-500.jpg 500w, ${IMG}/photo-f200472089-960.jpg 960w`}
              sizes="(max-width: 1023px) 100vw, 40vw" width="960" height="1433" decoding="async"
              alt="A doctor taking notes during a phone consultation" className="size-full object-cover object-[50%_30%]" />
          </div>
        )}
      />

      {/* Facts */}
      <section aria-label="MindCare in numbers" className="pt-12 sm:pt-16">
        <div className={cx(wrap, 'grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4')}>
          {facts.map(([n, t], i) => (
            <Reveal key={t} delay={i * 80} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <p className="font-display text-[34px] leading-none tracking-tight text-ink sm:text-[44px]">{n}</p>
              <p className="mt-2 text-[15px] text-slate-600">{t}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="py-20 lg:py-28">
        <div className={cx(wrap, 'grid gap-10 lg:grid-cols-12 lg:gap-6')}>
          <Reveal className="lg:col-span-5"><SectionHead title="Why we built it." muted="Booking care should not be the hard part." /></Reveal>
          <Reveal delay={100} className="space-y-5 text-lg leading-relaxed text-slate-600 lg:col-span-6 lg:col-start-7">
            <p>Asking for help with your mental health takes courage. Long queues, phone calls that go unanswered and paper files that get lost make that first step harder than it should be.</p>
            <p>At MindCare you choose a specialist, see their real free times and book in a minute. After the visit your prescription, test advice and invoice are waiting in your portal, and between visits you can check in on your mood and message your doctor.</p>
            <p>Behind the scenes the same system runs the front desk, the lab queue, billing and the clinic's accounts, so the team spends less time on paperwork and more time with patients.</p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section aria-labelledby="values" className="bg-surface py-20 lg:py-28">
        <div className={wrap}>
          <Reveal><SectionHead id="values" title="How we work" lead="Four promises that shape every visit." /></Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 80} className="group rounded-3xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 transition duration-300 group-hover:bg-brand-600 group-hover:text-white"><Icon className="size-5" aria-hidden /></span>
                <h3 className="mt-5 text-lg font-medium tracking-tight">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors */}
      <section aria-labelledby="doctors" className="py-20 lg:py-28">
        <div className={wrap}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <Reveal><SectionHead id="doctors" title="Our doctors" lead="Four specialists, each with their own days and hours." /></Reveal>
            <Link to="/services" className="link-draw inline-flex min-h-11 w-fit shrink-0 items-center gap-1.5 font-semibold text-brand-700">See services and fees <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {DOCTORS.map((d, i) => {
              const fee = SPECIALISTS.find((s) => s.name.toLowerCase().startsWith(d.role.split(' ')[0].toLowerCase()))?.fee;
              return (
                <Reveal key={d.name} delay={i * 80} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <Avatar name={d.name} size="lg" />
                  <h3 className="mt-5 text-lg font-medium tracking-tight">{d.name}</h3>
                  <p className="text-sm font-semibold text-brand-700">{d.role}</p>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-slate-600">{d.bio}</p>
                  <dl className="mt-5 space-y-1.5 rounded-2xl bg-surface p-3.5 text-sm text-slate-600">
                    <div className="flex items-center gap-2"><CalendarCheck className="size-4 text-brand-600" aria-hidden /><dt className="sr-only">Days</dt><dd>{d.days}</dd></div>
                    <div className="flex items-center gap-2"><Clock className="size-4 text-brand-600" aria-hidden /><dt className="sr-only">Hours</dt><dd>{d.hours}{d.video && ', video 6 – 10 PM'}</dd></div>
                    {fee && <div className="flex items-center gap-2"><span className="w-4 text-center font-semibold text-brand-600" aria-hidden>৳</span><dt className="sr-only">Fee</dt><dd>{taka(fee)} a visit</dd></div>}
                  </dl>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <CtaBand />
    </PublicLayout>
  );
}
