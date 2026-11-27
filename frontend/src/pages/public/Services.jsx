import { Link } from 'react-router-dom';
import { Building2, Video, Check, Receipt, BadgePercent, Wallet, FlaskConical, ArrowRight } from 'lucide-react';
import { PublicLayout, PageHero, SectionHead, CtaBand, PrimaryLink, useMainAction, wrap } from '@/components/public/kit';
import Reveal from '@/components/ui/Reveal';
import { cx } from '@/components/ui';
import { SPECIALISTS, TESTS, PAYMENT_METHODS, taka } from '@/content/clinic';

const visits = [
  { icon: Building2, title: 'Clinic visit', time: '15 minutes', when: 'Saturday to Thursday, 9 AM to 9 PM', points: ['Meet your doctor in a private consulting room', 'Tests can be run the same day', 'Booked in 15-minute slots'] },
  { icon: Video, title: 'Video consultation', time: '30 minutes', when: 'Evenings, 6 PM to 10 PM', points: ['Talk from home on your phone or computer', 'Join the waiting room 10 minutes early', 'Not recorded; the video goes straight between you and your doctor'] },
];

export default function Services() {
  const main = useMainAction();
  return (
    <PublicLayout title="Services and fees">
      <PageHero
        eyebrow="Services and fees"
        crumb="Services and fees"
        title="Care for the mind, priced up front"
        lead="Four specialties, two ways to visit and one clear fee for each. You see the price before you book and pay only after the visit."
      >
        <div className="mt-8 flex flex-wrap gap-2">
          {SPECIALISTS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="inline-flex min-h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-brand-400 hover:text-brand-800">{s.name}</a>
          ))}
        </div>
      </PageHero>

      {/* Specialists */}
      <section aria-labelledby="specialties" className="py-20 lg:py-28">
        <div className={wrap}>
          <Reveal><SectionHead id="specialties" title="Our specialties" lead="Choose the specialist who fits what you are going through. Not sure? Start with a psychiatrist or psychologist; they will guide you." /></Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {SPECIALISTS.map(({ id, icon: Icon, name, text, helps, fee }, i) => (
              <Reveal key={id} delay={(i % 2) * 100} id={id} className="group scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 transition duration-300 group-hover:bg-brand-600 group-hover:text-white"><Icon className="size-5" aria-hidden /></span>
                  <p className="text-right font-display text-2xl text-ink tabular-nums">{taka(fee)}<span className="block text-sm text-slate-500">a visit</span></p>
                </div>
                <h3 className="mt-5 text-2xl font-medium tracking-tight">{name}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{text}</p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {helps.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-[15px] text-slate-700"><Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />{h}</li>
                  ))}
                </ul>
                <Link to={main.to} className="link-draw mt-6 inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-700">
                  Book a {name.toLowerCase()} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Visit types */}
      <section aria-labelledby="visits" className="bg-surface py-20 lg:py-28">
        <div className={wrap}>
          <Reveal><SectionHead id="visits" title="Two ways to visit" lead="The fee is the same either way." /></Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {visits.map(({ icon: Icon, title, time, when, points }, i) => (
              <Reveal key={title} delay={i * 100} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl bg-ink text-white"><Icon className="size-5" aria-hidden /></span>
                  <div>
                    <h3 className="text-xl font-medium tracking-tight">{title}</h3>
                    <p className="text-sm text-slate-500">{time} · {when}</p>
                  </div>
                </div>
                <ul className="mt-6 space-y-3">
                  {points.map((p) => <li key={p} className="flex items-start gap-2.5 text-[15px] text-slate-700"><Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />{p}</li>)}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tests */}
      <section aria-labelledby="tests" className="py-20 lg:py-28">
        <div className={cx(wrap, 'grid gap-10 lg:grid-cols-12 lg:gap-6')}>
          <Reveal className="lg:col-span-4">
            <SectionHead id="tests" title="Tests and screenings" lead="Your doctor may suggest a test. You accept or decline each one in the portal and pay only for the ones you accept." />
            <p className="mt-6 flex items-center gap-2 text-sm text-slate-500"><FlaskConical className="size-4 text-brand-600" aria-hidden />Results appear in your portal once the lab records them.</p>
          </Reveal>
          <Reveal delay={100} className="overflow-hidden rounded-3xl border border-slate-200 bg-white lg:col-span-7 lg:col-start-6">
            <ul className="divide-y divide-slate-100">
              {TESTS.map(([name, desc, price]) => (
                <li key={name} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-brand-50/40 sm:px-6">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{name}</p>
                    <p className="text-sm text-slate-500">{desc}</p>
                  </div>
                  <p className="shrink-0 font-display text-lg tabular-nums text-ink">{taka(price)}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Paying */}
      <section aria-labelledby="paying" className="bg-surface py-20 lg:py-28">
        <div className={wrap}>
          <Reveal><SectionHead id="paying" title="How paying works" /></Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              [Receipt, 'Invoice after the visit', 'The front desk adds your consultation and any accepted tests to one invoice in your portal.'],
              [BadgePercent, '40% off follow-ups', 'See the same doctor again within two months and the consultation fee is 40% lower, applied automatically.'],
              [Wallet, 'Pay from your phone', `Pay by ${PAYMENT_METHODS.slice(0, -1).join(', ')} or ${PAYMENT_METHODS.at(-1).toLowerCase()} and download your receipt.`],
            ].map(([Icon, t, d], i) => (
              <Reveal key={t} delay={i * 80} className="rounded-3xl border border-slate-200 bg-white p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100"><Icon className="size-5" aria-hidden /></span>
                <h3 className="mt-5 text-lg font-medium tracking-tight">{t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{d}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 flex flex-col gap-3 sm:flex-row">
            <PrimaryLink to={main.to}>{main.label}</PrimaryLink>
            <Link to="/faq" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 font-semibold text-ink transition hover:border-slate-400">Read the questions</Link>
          </Reveal>
        </div>
      </section>

      <CtaBand title="Ready when you are." />
    </PublicLayout>
  );
}
