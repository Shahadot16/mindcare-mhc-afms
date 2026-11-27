import { useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, ArrowLeft, ArrowRight, LifeBuoy, Brain, Wind, History } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import useFetch from '@/hooks/useFetch';
import { Badge, Button, Card, CardHeader, ErrorBox, Modal, PageHeader, PageLoader, cx } from '@/components/ui';
import ScoreChart, { severityTone } from '@/components/charts/ScoreChart';
import { fmtDate } from '@/utils/format';

const ICON = { PHQ9: Brain, GAD7: Wind };

export default function Assessments() {
  const defs = useFetch('/assessments/definitions');
  const mine = useFetch('/assessments/mine', []);
  const [taking, setTaking] = useState(null); // definition
  const [answers, setAnswers] = useState([]);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (defs.loading || mine.loading) return <PageLoader />;
  if (defs.error) return <ErrorBox message={defs.error} onRetry={defs.reload} />;
  const { options, types } = defs.data;
  const history = mine.data || [];
  const latest = (t) => history.find((a) => a.type === t);

  const start = (def) => { setTaking(def); setAnswers(Array(def.questions.length).fill(null)); setStep(0); setResult(null); };
  const answer = (v) => {
    const next = [...answers]; next[step] = v; setAnswers(next);
    if (step < taking.questions.length - 1) setTimeout(() => setStep((s) => s + 1), 180);
  };
  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/assessments', { type: taking.type, answers });
      setResult(data);
      mine.reload({ silent: true });
    } catch (e) { toast.error(errMsg(e)); } finally { setSubmitting(false); }
  };
  const done = answers.length && answers.every((a) => a !== null);

  return (
    <>
      <PageHeader title="Self-assessments" subtitle="Standard questionnaires used by clinicians worldwide. Takes about 2 minutes." />

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <LifeBuoy className="mt-0.5 size-5 shrink-0 text-sky-600" />
        <p>These screenings help your doctor track how you're doing. They are not a diagnosis. If you are in danger or thinking about harming yourself, please call <b>999</b> or go to the nearest emergency department right away.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {types.map((t) => {
          const Icon = ICON[t.type];
          const l = latest(t.type);
          return (
            <Card key={t.type} className="flex flex-col p-6">
              <div className="flex items-start gap-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100"><Icon className="size-6" /></span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{t.name}</h3>
                  <p className="text-sm text-slate-500">{t.questions.length} questions · about the last 2 weeks</p>
                </div>
              </div>
              {l ? (
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div><p className="text-xs text-slate-500">Last result · {fmtDate(l.createdAt)}</p><p className="font-display text-2xl font-bold">{l.score}<span className="text-sm font-medium text-slate-400"> / {t.max}</span></p></div>
                  <Badge tone={severityTone(l.severity)}>{l.severity}</Badge>
                </div>
              ) : <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">You haven't taken this one yet.</p>}
              <Button className="mt-5" icon={ClipboardCheck} onClick={() => start(t)}>{l ? 'Take again' : 'Start'}</Button>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {types.map((t) => (
          <Card key={t.type}>
            <CardHeader title={`${t.short} score history`} subtitle={`${t.name}, lower is better`} icon={History} />
            <div className="px-2 py-4 sm:px-4"><ScoreChart type={t.type} items={[...history].reverse()} /></div>
          </Card>
        ))}
      </div>

      <Modal open={Boolean(taking)} onClose={() => setTaking(null)} size="lg" title={taking?.name} subtitle={result ? 'Your result' : taking?.prompt}>
        {taking && !result && (
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${((answers.filter((a) => a !== null).length) / taking.questions.length) * 100}%` }} /></div>
              <span className="text-xs font-semibold text-slate-500">{step + 1} / {taking.questions.length}</span>
            </div>
            <p className="min-h-[56px] font-display text-lg font-bold text-slate-900">{taking.questions[step]}</p>
            <div className="mt-5 grid gap-2">
              {options.map((o, v) => (
                <button key={o} onClick={() => answer(v)}
                  className={cx('flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition cursor-pointer',
                    answers[step] === v ? 'border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-100' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50')}>
                  {o}<span className="text-xs text-slate-400">{v}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="ghost" icon={ArrowLeft} disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
              {step < taking.questions.length - 1
                ? <Button variant="secondary" disabled={answers[step] === null} onClick={() => setStep((s) => s + 1)}>Next <ArrowRight className="size-4" /></Button>
                : <Button disabled={!done} loading={submitting} onClick={submit}>See my result</Button>}
            </div>
          </div>
        )}
        {result && (
          <div className="text-center">
            <p className="font-display text-6xl font-bold text-slate-900">{result.score}<span className="text-2xl text-slate-400"> / {taking.max}</span></p>
            <Badge tone={severityTone(result.severity)} className="mt-3 text-sm">{result.severity}</Badge>
            {result.riskFlag ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-left text-sm text-rose-900">
                <p className="font-bold">You're not alone, and help is available.</p>
                <p className="mt-1">You mentioned thoughts of hurting yourself. Your care team has been notified and will reach out. If you feel unsafe right now, please call <b>999</b>, go to the nearest hospital, or contact someone you trust immediately.</p>
              </div>
            ) : (
              <p className={cx('mx-auto mt-6 max-w-md text-sm', result.score >= 10 ? 'text-amber-800' : 'text-slate-600')}>
                {result.score >= 10
                  ? 'Your score suggests symptoms worth discussing with a doctor. Consider booking a consultation. Your doctor will see this result.'
                  : 'Thank you for checking in. Keep tracking your mood. Small daily habits make a difference.'}
              </p>
            )}
            <Button className="mt-6" onClick={() => setTaking(null)}>Done</Button>
          </div>
        )}
      </Modal>
    </>
  );
}
