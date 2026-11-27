import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, ShieldCheck, Video } from 'lucide-react';
import Logo from '@/components/layout/Logo';

const facts = [
  { icon: CalendarCheck, text: '15-minute clinic visits, booked online' },
  { icon: Video, text: 'Video consultations in the evening' },
  { icon: ShieldCheck, text: 'Every change to your record is logged' },
];

/** Split-screen layout used by the login, register and password pages. */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1fr_1.05fr]">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <img src="/assets/img/photo-f200472089-960.jpg" alt="A doctor taking notes during a phone consultation"
          className="absolute inset-0 size-full object-cover object-[50%_30%]" width="960" height="1433" decoding="async" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(20_34_40/.78)_0%,rgb(20_34_40/.12)_28%,rgb(20_34_40/.3)_55%,rgb(20_34_40/.92)_100%)]" />
        <div className="relative flex h-full flex-col p-10">
          <Link to="/" className="w-fit rounded-xl"><Logo light /></Link>
          <div className="mt-auto max-w-md animate-enter">
            <p className="font-display text-[34px] font-semibold leading-[1.1] tracking-tight text-white">
              Psychiatrists and psychologists you can book online.
            </p>
            <ul className="mt-8 space-y-3">
              {facts.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-[15px] text-slate-200">
                  <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-brand-200 ring-1 ring-inset ring-white/15 backdrop-blur"><Icon className="size-4.5" aria-hidden /></span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="rounded-xl lg:hidden"><Logo /></Link>
          <Link to="/" className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden /> Back to home
          </Link>
        </div>
        <main className="mx-auto my-auto w-full max-w-md animate-fade-up py-10">
          <h1 className="text-3xl font-bold sm:text-[34px]">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
