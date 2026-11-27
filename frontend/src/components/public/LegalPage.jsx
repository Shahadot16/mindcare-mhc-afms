import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { PublicLayout, PageHero, wrap } from '@/components/public/kit';
import { cx } from '@/components/ui';
import { CLINIC } from '@/content/clinic';

/** A long document with a sticky contents list that follows the reader. sections: [{ id, title, body }] */
export default function LegalPage({ title, lead, sections }) {
  const [active, setActive] = useState(sections[0]?.id);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-20% 0px -70% 0px' });
    sections.forEach((s) => { const el = document.getElementById(s.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [sections]);

  return (
    <PublicLayout title={title}>
      <PageHero eyebrow="Legal" title={title} lead={lead}>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
          <span>Last updated {CLINIC.updated}</span>
          <button type="button" onClick={() => window.print()} className="no-print inline-flex min-h-10 items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-800">
            <Printer className="size-4" aria-hidden /> Print or save as PDF
          </button>
        </div>
      </PageHero>

      <div className={cx(wrap, 'grid gap-10 py-14 lg:grid-cols-12 lg:gap-6 lg:py-20')}>
        <nav aria-label="Contents" className="no-print lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-28 lg:border-0 lg:bg-transparent lg:p-0">
            <p className="mb-2 text-sm font-semibold text-slate-500">On this page</p>
            <ol className="space-y-0.5">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} aria-current={active === s.id ? 'true' : undefined}
                    className={cx('flex min-h-10 items-center gap-3 rounded-lg border-l-2 px-3 py-1.5 text-[15px] transition',
                      active === s.id ? 'border-brand-600 bg-brand-50/60 font-medium text-ink' : 'border-transparent text-slate-600 hover:bg-surface hover:text-ink')}>
                    <span className="w-5 shrink-0 text-xs tabular-nums text-slate-400">{i + 1}.</span>{s.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <article className="lg:col-span-8 lg:col-start-5">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28 border-b border-slate-200 py-8 first:pt-0 last:border-0">
              <h2 className="text-2xl font-normal tracking-tight sm:text-[28px]"><span className="mr-2 text-slate-400">{i + 1}.</span>{s.title}</h2>
              <div className="legal mt-4 space-y-4 text-[16px] leading-relaxed text-slate-700">{s.body}</div>
            </section>
          ))}
          <p className="mt-10 rounded-2xl bg-surface p-5 text-[15px] text-slate-600">
            Questions about this page? <Link to="/contact" className="link-draw font-semibold text-brand-700">Contact the clinic</Link> or email <a href={`mailto:${CLINIC.email}`} className="link-draw font-semibold text-brand-700">{CLINIC.email}</a>.
          </p>
        </article>
      </div>
    </PublicLayout>
  );
}
