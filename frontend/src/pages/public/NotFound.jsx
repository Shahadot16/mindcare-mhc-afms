import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Compass className="size-8" /></span>
        <p className="mt-6 font-display text-6xl font-extrabold text-slate-900">404</p>
        <p className="mt-2 text-slate-500">We couldn't find that page.</p>
        <Link to="/" className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700">Back home</Link>
      </div>
    </div>
  );
}
