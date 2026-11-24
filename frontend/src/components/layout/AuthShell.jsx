import { Link } from 'react-router-dom';
import { Quote } from 'lucide-react';
import Logo from '@/components/layout/Logo';

/** Split-screen layout used by the login and register pages. */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-slate-900 p-10 lg:flex lg:flex-col">
        <div className="absolute -left-32 -top-32 size-[480px] rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 size-[420px] rounded-full bg-indigo-500/30 blur-3xl" />
        <Link to="/" className="relative"><Logo light /></Link>
        <div className="relative mt-auto max-w-md">
          <Quote className="size-10 text-brand-400/60" />
          <p className="mt-4 font-display text-2xl font-bold leading-snug text-white">
            There is no health without mental health. Every appointment booked here is a step toward feeling better.
          </p>
          <p className="mt-4 text-sm text-slate-400">MindCare · Mental Health Care AFMS</p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[['4', 'Portals'], ['15 min', 'Slots'], ['40%', 'Follow-up off']].map(([v, l]) => (
              <div key={l} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <p className="font-display text-xl font-extrabold text-white">{v}</p>
                <p className="text-xs text-slate-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col px-4 py-8 sm:px-10">
        <Link to="/" className="lg:hidden"><Logo /></Link>
        <div className="mx-auto my-auto w-full max-w-md animate-fade-up py-10">
          <h1 className="text-3xl font-extrabold">{title}</h1>
          {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
