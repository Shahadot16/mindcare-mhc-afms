import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Video } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { fmtTime } from '@/utils/format';

// Same rules as the server (backend/src/utils/callWindow.js). The server always has the final say.
const MIN = 60 * 1000;
export const callWindow = (a) => {
  const start = new Date(`${a.date}T${a.startTime}:00`);
  const end = new Date(`${a.date}T${a.endTime}:00`);
  return { opensAt: new Date(start - 10 * MIN), start, end, closesAt: new Date(end.getTime() + 10 * MIN) };
};

/** "Video" or "In-person" pill. */
export function ModeBadge({ mode }) {
  return mode === 'Video'
    ? <Badge tone="violet"><Video className="size-3" />Video</Badge>
    : <Badge tone="slate"><Building2 className="size-3" />In-person</Badge>;
}

/** Re-renders every 30 seconds so time-based buttons switch on by themselves. */
function useTick(ms = 30 * 1000) {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

/**
 * Join button for an approved video appointment.
 * Shows "Opens at …" before the window, the button during it, and nothing after it closes.
 */
export function JoinCallButton({ appointment: a, size = 'sm', role = 'Patient' }) {
  useTick();
  if (a?.mode !== 'Video' || a.status !== 'Approved' || a.call?.endedAt) return null;
  const w = callWindow(a);
  const now = new Date();
  if (now > w.closesAt) return null;
  if (now < w.opensAt) {
    const sameDay = now.toDateString() === w.opensAt.toDateString();
    return (
      <Button size={size} variant="secondary" icon={Video} disabled title="You can join 10 minutes before the start time">
        {sameDay ? `Call opens ${fmtTime(`${String(w.opensAt.getHours()).padStart(2, '0')}:${String(w.opensAt.getMinutes()).padStart(2, '0')}`)}` : 'Video call'}
      </Button>
    );
  }
  return (
    <Link to={`/app/call/${a._id}`}>
      <Button size={size} icon={Video} variant="video">{role === 'Doctor' ? 'Start video call' : 'Join video call'}</Button>
    </Link>
  );
}
