import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { Avatar } from '@/components/ui';
import { timeAgo } from '@/components/layout/NotificationBell';

/** Unreviewed self-harm flags from patient assessments. Renders nothing when there are none. */
export default function RiskAlerts() {
  const { data = [] } = useFetch('/assessments/alerts', []);
  if (!data.length) return null;
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-rose-200 bg-rose-50/70">
      <div className="flex items-center gap-2 border-b border-rose-200 px-5 py-3 text-rose-800">
        <AlertTriangle className="size-5" />
        <p className="font-bold">{data.length} risk alert{data.length > 1 ? 's' : ''} need{data.length > 1 ? '' : 's'} review</p>
      </div>
      <ul className="divide-y divide-rose-100">
        {data.map((a) => (
          <li key={a._id}>
            <Link to={`/app/patients/${a.patient._id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-rose-100/50">
              <Avatar name={a.patient.fullName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{a.patient.fullName}</p>
                <p className="text-xs text-rose-700">{a.type === 'PHQ9' ? 'PHQ-9' : 'GAD-7'} score {a.score} ({a.severity}) · self-harm item flagged · {timeAgo(a.createdAt)}</p>
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-rose-700">Review <ArrowRight className="size-4" /></span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
