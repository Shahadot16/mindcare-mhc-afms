import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, MessageCircleQuestion, X } from 'lucide-react';
import { PublicLayout, PageHero, wrap } from '@/components/public/kit';
import Reveal from '@/components/ui/Reveal';
import { cx } from '@/components/ui';
import { FAQ_GROUPS } from '@/content/clinic';

export default function Faq() {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => FAQ_GROUPS
    .filter((g) => topic === 'all' || g.id === topic)
    .map((g) => ({ ...g, items: g.items.filter((i) => !q || `${i.q} ${i.a}`.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length), [q, topic]);
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <PublicLayout title="Questions">
      <PageHero eyebrow="Help centre" crumb="FAQ" title="Questions and answers"
        lead="Everything about booking, visits, payments and your records. Can't find it? Contact the clinic.">
        <div className="relative mt-8 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions, for example: cancel, video, pay"
            aria-label="Search questions" className="input min-h-14 rounded-2xl pl-12 pr-12 text-base" />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search"
              className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-ink"><X className="size-4" /></button>
          )}
        </div>
      </PageHero>

      <section className="py-14 lg:py-20">
        <div className={cx(wrap, 'grid gap-10 lg:grid-cols-12 lg:gap-6')}>
          {/* Topics */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-28">
              <p className="mb-3 text-sm font-semibold text-slate-500">Topics</p>
              <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-col lg:px-0" role="tablist" aria-label="Topics">
                {[{ id: 'all', title: 'All questions' }, ...FAQ_GROUPS].map((g) => (
                  <button key={g.id} type="button" role="tab" aria-selected={topic === g.id} onClick={() => setTopic(g.id)}
                    className={cx('min-h-11 shrink-0 rounded-xl px-4 text-left text-[15px] font-medium transition lg:w-full',
                      topic === g.id ? 'bg-ink text-white' : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-surface lg:bg-transparent lg:ring-0')}>
                    {g.title}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Answers */}
          <div className="lg:col-span-8 lg:col-start-5">
            <p className="mb-6 text-sm text-slate-500" aria-live="polite">{total} {total === 1 ? 'question' : 'questions'}{q && <> for “{query.trim()}”</>}</p>
            {groups.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center">
                <MessageCircleQuestion className="mx-auto size-10 text-slate-400" aria-hidden />
                <p className="mt-4 font-medium text-ink">No question matches “{query}”.</p>
                <p className="mt-1 text-slate-600">Try another word, or <Link to="/contact" className="link-draw font-semibold text-brand-700">ask the clinic</Link>.</p>
              </div>
            ) : groups.map((g, gi) => (
              <Reveal key={g.id} delay={gi * 60} className="mb-12 last:mb-0">
                <h2 id={`topic-${g.id}`} className="text-2xl font-normal tracking-tight">{g.title}</h2>
                <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
                  {g.items.map(({ q: question, a }, i) => (
                    <details key={question} className="group" open={!!q || (gi === 0 && i === 0)}>
                      <summary className="flex min-h-16 list-none items-center justify-between gap-6 py-5 text-[17px] font-medium text-ink transition hover:text-brand-700 [&::-webkit-details-marker]:hidden">
                        {question}
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface transition duration-300 group-open:rotate-45 group-open:bg-brand-600 group-open:text-white"><Plus className="size-4" aria-hidden /></span>
                      </summary>
                      <p className="-mt-1 max-w-[65ch] pb-6 text-[15px] leading-relaxed text-slate-600 group-open:animate-fade-up">{a}</p>
                    </details>
                  ))}
                </div>
              </Reveal>
            ))}

            <div className="mt-14 flex flex-col gap-4 rounded-3xl bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="text-lg font-medium text-ink">Still have a question?</p>
                <p className="mt-1 text-slate-600">Patients with an account can message their doctor from the portal.</p>
              </div>
              <Link to="/contact" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-ink px-6 font-semibold text-white transition hover:-translate-y-px hover:bg-slate-800">Contact the clinic</Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
