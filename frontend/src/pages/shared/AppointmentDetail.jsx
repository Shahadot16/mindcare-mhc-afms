import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, CalendarDays, Clock, Pill, ClipboardList, CalendarClock, FileText, HeartPulse } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import { Avatar, Button, Card, ErrorBox, PageLoader, StatusBadge } from '@/components/ui';
import TestResponse from '@/components/appointments/TestResponse';
import { fmtDate, fmtTime, money } from '@/utils/format';
import { JoinCallButton, ModeBadge } from '@/components/appointments/VideoCall';

/** Visit summary / prescription. Printable. */
export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: a, setData, loading, error, reload } = useFetch(`/appointments/${id}`);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-5 flex items-center justify-between">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)}>Back</Button>
        {a.status === 'Completed' && <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print prescription</Button>}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 bg-linear-to-br from-brand-600 to-indigo-600 px-6 py-6 text-white sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-white/15"><HeartPulse className="size-6" /></span>
            <div>
              <p className="font-display text-lg font-extrabold">MindCare Clinic</p>
              <p className="text-xs text-white/70">{a.status === 'Completed' ? 'Prescription & visit summary' : 'Appointment details'}</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="flex items-center justify-end gap-1.5"><CalendarDays className="size-4" />{fmtDate(a.date)}</p>
            <p className="mt-1 flex items-center justify-end gap-1.5 text-white/80"><Clock className="size-4" />{fmtTime(a.startTime)} – {fmtTime(a.endTime)}</p>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-100 px-6 py-5 sm:grid-cols-2 sm:px-8">
          <div className="flex items-center gap-3">
            <Avatar name={a.doctor.fullName} />
            <div><p className="text-xs text-slate-500">Doctor</p><p className="font-semibold">{a.doctor.fullName}</p><p className="text-xs text-slate-500">{a.doctor.specialization}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={a.patient.fullName} />
            <div>
              <p className="text-xs text-slate-500">Patient</p><p className="font-semibold">{a.patient.fullName}</p>
              <p className="text-xs text-slate-500">{[a.patient.age && `${a.patient.age} yrs`, a.patient.gender, a.patient.contactNumber].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={a.status} />
            <ModeBadge mode={a.mode} />
            <span className="text-sm text-slate-500">Consultation fee {money(a.consultationFee)}</span>
            {a.call?.durationSec > 0 && <span className="text-sm text-slate-500">· Video call {Math.round(a.call.durationSec / 60)} min</span>}
            <span className="no-print ml-auto"><JoinCallButton appointment={a} role={user.role} /></span>
          </div>

          {a.description && <Section icon={FileText} title="Reason for visit">{a.description}</Section>}

          {a.status === 'Completed' ? (<>
            <Section icon={ClipboardList} title="Diagnosis">{a.diagnosis}</Section>
            <Section icon={Pill} title="Prescription">
              {a.prescription ? (
                <ol className="space-y-2">
                  {a.prescription.split('\n').filter(Boolean).map((line, i) => (
                    <li key={i} className="flex gap-3"><span className="font-display font-bold text-brand-600">℞</span><span>{line}</span></li>
                  ))}
                </ol>
              ) : <span className="text-slate-400">No medicine prescribed</span>}
            </Section>
            {a.followUpDate && <Section icon={CalendarClock} title="Follow-up">Please book a follow-up on or around <b>{fmtDate(a.followUpDate)}</b>. Follow-ups within 2 months get 40% off the consultation fee.</Section>}
            {a.tests?.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Recommended tests</h3>
                <TestResponse appointment={a} canRespond={user.role === 'Patient'} onChange={setData} />
                {user.role === 'Patient' && a.tests.some((t) => t.status === 'Suggested') && !a.isInvoiceGenerated && (
                  <p className="no-print mt-2 text-xs text-slate-500">Accepted tests are added to your bill.</p>
                )}
              </div>
            )}
          </>) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              {a.status === 'Cancelled' ? 'This appointment was cancelled.' : 'The diagnosis and prescription will appear here after your visit.'}
            </p>
          )}

          {a.isInvoiceGenerated && user.role !== 'Doctor' && (
            <p className="no-print text-sm text-slate-500">This visit has been billed. <Link to={user.role === 'Patient' ? '/app/bills' : '/app/billing'} className="font-semibold text-brand-600">View bills →</Link></p>
          )}
        </div>
        {a.status === 'Completed' && (
          <div className="flex justify-end border-t border-dashed border-slate-200 px-8 py-6">
            <div className="text-center"><p className="font-display text-lg italic text-slate-700">{a.doctor.fullName}</p><p className="mt-1 border-t border-slate-300 pt-1 text-xs text-slate-500">Signature</p></div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500"><Icon className="size-4 text-brand-500" />{title}</h3>
      <div className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{children}</div>
    </div>
  );
}
