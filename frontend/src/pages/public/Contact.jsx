import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, UserPlus, Mail, LifeBuoy, Clock, MapPin, Send, ArrowRight, AlertCircle } from 'lucide-react';
import { PublicLayout, PageHero, wrap } from '@/components/public/kit';
import Reveal from '@/components/ui/Reveal';
import { cx } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { CLINIC, HOURS } from '@/content/clinic';

const TOPICS = ['Booking a first visit', 'A visit for a child or teenager', 'Fees and payments', 'My account or portal', 'Something else'];

function FieldError({ msg }) {
  return msg ? <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600"><AlertCircle className="size-3.5" aria-hidden />{msg}</span> : null;
}

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', topic: TOPICS[0], message: '' });
  const [errors, setErrors] = useState({});
  const [opened, setOpened] = useState(false);
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); };

  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if (!form.name.trim()) err.name = 'Write your name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'Write an email address we can reply to';
    if (form.message.trim().length < 10) err.message = 'Tell us a little more (10 characters or more)';
    setErrors(err);
    if (Object.keys(err).length) return;
    const body = `${form.message}\n\n${form.name}\n${form.email}`;
    window.location.href = `mailto:${CLINIC.email}?subject=${encodeURIComponent(`MindCare: ${form.topic}`)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  };

  const field = (k) => cx('input', errors[k] && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100');

  return (
    <form onSubmit={submit} noValidate className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
      <h2 className="text-2xl font-normal tracking-tight">Send the clinic a message</h2>
      <p className="mt-2 text-[15px] text-slate-600">For general questions. Please do not include medical details; your doctor will ask for those in a visit.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="label">Your name</span><input className={field('name')} value={form.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errors.name} /><FieldError msg={errors.name} /></label>
        <label className="block"><span className="label">Email</span><input type="email" className={field('email')} value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} /><FieldError msg={errors.email} /></label>
        <label className="block sm:col-span-2"><span className="label">Topic</span>
          <select className="input" value={form.topic} onChange={set('topic')}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <label className="block sm:col-span-2"><span className="label">Message</span><textarea rows={5} className={cx(field('message'), 'resize-y')} value={form.message} onChange={set('message')} aria-invalid={!!errors.message} /><FieldError msg={errors.message} /></label>
      </div>
      <button type="submit" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 font-semibold text-white transition hover:-translate-y-px hover:bg-brand-700 active:translate-y-0 active:scale-[0.98] sm:w-auto">
        <Send className="size-4" aria-hidden /> Write the email
      </button>
      <p className="mt-3 text-xs text-slate-500" aria-live="polite">
        {opened ? 'Your email app should now be open with the message filled in. Press send there.' : 'This opens your email app with your message ready to send.'}
      </p>
    </form>
  );
}

export default function Contact() {
  const { user } = useAuth();
  const ways = [
    user?.role === 'Patient' || user?.role === 'Doctor'
      ? { icon: MessageCircle, title: 'Message your doctor', text: 'The fastest way for questions about your care.', to: '/app/messages', cta: 'Open messages' }
      : { icon: MessageCircle, title: 'Already a patient?', text: 'Log in and message your doctor from the portal.', to: '/login', cta: 'Log in' },
    { icon: UserPlus, title: 'New to MindCare?', text: 'Create a free account and book your first visit.', to: '/register', cta: 'Create an account' },
    { icon: Mail, title: 'General questions', text: CLINIC.email, href: `mailto:${CLINIC.email}`, cta: 'Email the clinic' },
  ];

  return (
    <PublicLayout title="Contact">
      <PageHero eyebrow="Contact" crumb="Contact" title="Talk to the clinic"
        lead="Book online any time. For anything else, pick the way that suits you below." />

      <section className="py-14 lg:py-20">
        <div className={cx(wrap, 'grid gap-5 md:grid-cols-3')}>
          {ways.map(({ icon: Icon, title, text, to, href, cta }, i) => {
            const Tag = to ? Link : 'a';
            return (
              <Reveal key={title} delay={i * 80}>
                <Tag {...(to ? { to } : { href })} className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift">
                  <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 transition duration-300 group-hover:bg-brand-600 group-hover:text-white"><Icon className="size-5" aria-hidden /></span>
                  <h2 className="mt-5 text-lg font-medium tracking-tight">{title}</h2>
                  <p className="mt-1.5 flex-1 break-words text-[15px] text-slate-600">{text}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 font-semibold text-brand-700">{cta}<ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></span>
                </Tag>
              </Reveal>
            );
          })}
        </div>

        <div className={cx(wrap, 'mt-10 grid gap-6 lg:grid-cols-12')}>
          <Reveal className="lg:col-span-7"><ContactForm /></Reveal>
          <Reveal delay={100} className="space-y-6 lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-normal tracking-tight"><Clock className="size-5 text-brand-600" aria-hidden />Opening hours</h2>
              <dl className="mt-5 divide-y divide-slate-100">
                {HOURS.map(([d, h, k]) => (
                  <div key={d} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-3">
                    <dt className="font-medium text-ink">{d}{k && <span className="block text-sm font-normal text-slate-500">{k}</span>}</dt>
                    <dd className={cx('tabular-nums', h === 'Closed' ? 'text-slate-500' : 'text-slate-700')}>{h}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 flex items-center gap-2 text-sm text-slate-600"><MapPin className="size-4 text-brand-600" aria-hidden />{CLINIC.city}</p>
            </div>
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-normal tracking-tight text-rose-900"><LifeBuoy className="size-5" aria-hidden />In an emergency</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-rose-900/80">We do not answer emergencies by email or messages. If you or someone else is in danger, call <a href={`tel:${CLINIC.emergency}`} className="font-semibold underline underline-offset-4">{CLINIC.emergency}</a> now or go to the nearest hospital emergency department.</p>
              <Link to="/get-help" className="mt-4 inline-flex min-h-11 items-center gap-1.5 font-semibold text-rose-800 hover:text-rose-950">What to do right now <ArrowRight className="size-4" aria-hidden /></Link>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicLayout>
  );
}
