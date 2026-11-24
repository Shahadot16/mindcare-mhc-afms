import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtDate } from '@/utils/format';

// Severity bands drawn behind the line (light tints of one warm hue: darker = more severe)
const BANDS = {
  PHQ9: [[0, 5], [5, 10], [10, 15], [15, 20], [20, 27]],
  GAD7: [[0, 5], [5, 10], [10, 15], [15, 21]],
};
const TINTS = ['#ffffff', '#fff7ed', '#ffedd5', '#fed7aa', '#fdba74'];
const C_LINE = '#4f46e5';

/** Score history for one questionnaire, with severity bands. */
export default function ScoreChart({ type, items, height = 220 }) {
  const data = items.filter((a) => a.type === type).map((a) => ({ at: a.createdAt, score: a.score, severity: a.severity }));
  const max = type === 'PHQ9' ? 27 : 21;
  if (data.length === 0) return <p className="grid place-items-center text-sm text-slate-500" style={{ height }}>No results yet.</p>;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          {BANDS[type].map(([y1, y2], i) => <ReferenceArea key={i} y1={y1} y2={y2} fill={TINTS[i]} fillOpacity={0.8} strokeOpacity={0} ifOverflow="hidden" />)}
          <CartesianGrid vertical={false} stroke="#eef2f6" strokeDasharray="3 3" />
          <XAxis dataKey="at" tickFormatter={(d) => fmtDate(d, { day: 'numeric', month: 'short' })} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} minTickGap={20} />
          <YAxis domain={[0, max]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip content={({ active, payload }) => active && payload?.length ? (
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
              <p className="font-semibold">{fmtDate(payload[0].payload.at)}</p>
              <p className="text-slate-600">Score <b className="text-slate-900">{payload[0].value}</b> / {max} · {payload[0].payload.severity}</p>
            </div>
          ) : null} />
          <Line type="monotone" dataKey="score" stroke={C_LINE} strokeWidth={2} dot={{ r: 4, fill: C_LINE, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export const severityTone = (s) => ({ Minimal: 'emerald', Mild: 'sky', Moderate: 'amber', 'Moderately severe': 'rose', Severe: 'rose' }[s] || 'slate');
