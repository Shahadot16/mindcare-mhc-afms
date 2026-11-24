import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Clock, Hourglass, MessageSquare, Mic, MicOff, Phone, PhoneOff, RefreshCw, ScreenShare, ScreenShareOff,
  Send, Stethoscope, TriangleAlert, UserCheck, UserX, Video, VideoOff, WifiOff, X,
} from 'lucide-react';
import api, { errMsg } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useRealtime } from '@/context/RealtimeContext';
import { Avatar, Badge, Button, Card, ConfirmDialog, ErrorBox, PageLoader, cx } from '@/components/ui';
import DiagnosisModal from '@/components/appointments/DiagnosisModal';
import { fmtDate, fmtTime } from '@/utils/format';

const pad = (n) => String(n).padStart(2, '0');
const clock = (ms) => fmtTime(`${pad(new Date(ms).getHours())}:${pad(new Date(ms).getMinutes())}`);
const mmss = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
};

/**
 * One-to-one video consultation (WebRTC). Socket.io carries only the signaling messages;
 * audio and video go directly between the two browsers.
 * Stages: check (camera/mic test) → waiting (waiting room) → call → ended
 */
export default function VideoCallPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useRealtime();
  const isDoctor = user.role === 'Doctor';

  const [info, setInfo] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [stage, setStage] = useState('check');
  const [presence, setPresence] = useState({ doctorPresent: false, patientPresent: false, admitted: false, startedAt: null });
  const [localStream, setLocalStream] = useState(null);
  const [mediaNote, setMediaNote] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [conn, setConn] = useState('new');
  const [peerLeft, setPeerLeft] = useState(false);
  const [ended, setEnded] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [joining, setJoining] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'end' | 'no-show' | 'cancel'
  const [busy, setBusy] = useState(false);
  const [notesFor, setNotesFor] = useState(null);

  const offset = useRef(0); // server clock − device clock
  const pcRef = useRef(null);
  const pendingIce = useRef([]);
  const localRef = useRef(null);
  const screenRef = useRef(null);
  const joinedRef = useRef(false);
  const stageRef = useRef(stage);
  stageRef.current = stage;

  // ---- Load the appointment and the call rules from the server
  useEffect(() => {
    api.get(`/calls/${id}`).then(({ data }) => {
      offset.current = new Date(data.serverNow).getTime() - Date.now();
      setNow(Date.now() + offset.current);
      setInfo(data);
      if (data.state.phase === 'ended') {
        setEnded({ by: data.appointment.call?.endedBy || 'Doctor', durationSec: data.appointment.call?.durationSec || 0 });
        setStage('ended');
      }
    }).catch((e) => setLoadError(errMsg(e)));
  }, [id]);

  // Server-synced clock, ticking every second
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset.current), 1000);
    return () => clearInterval(t);
  }, []);

  // ---- Camera and microphone
  const startMedia = useCallback(async () => {
    setMediaNote('');
    localRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localRef.current = s;
      setLocalStream(s); setCamOn(true); setMicOn(true);
    } catch {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        localRef.current = s;
        setLocalStream(s); setCamOn(false); setMicOn(true);
        setMediaNote('Camera not available, so you will join with audio only.');
      } catch {
        localRef.current = null;
        setLocalStream(null);
        setMediaNote('Camera and microphone are blocked. Allow them in the browser\'s address bar, then press "Test again".');
      }
    }
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaNote('This browser cannot make video calls. Please use the latest Chrome, Edge, Firefox or Safari.');
      return undefined;
    }
    startMedia();
    return () => {
      localRef.current?.getTracks().forEach((t) => t.stop());
      screenRef.current?.stop();
    };
  }, [startMedia]);

  // ---- WebRTC + signaling
  const emit = useCallback((event, payload, ack) => socket?.emit(event, { id, ...payload }, ack), [socket, id]);

  const closePeer = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    setRemoteStream(null);
  }, []);

  const newPeer = useCallback(() => {
    pcRef.current?.close();
    pendingIce.current = [];
    const pc = new RTCPeerConnection({ iceServers: info?.iceServers || [] });
    const stream = localRef.current;
    if (stream) stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    if (!stream?.getAudioTracks().length) pc.addTransceiver('audio', { direction: 'recvonly' });
    if (!stream?.getVideoTracks().length) pc.addTransceiver('video', { direction: 'recvonly' });
    if (screenRef.current) pc.getSenders().find((s) => s.track?.kind === 'video')?.replaceTrack(screenRef.current);
    pc.ontrack = (e) => setRemoteStream(e.streams[0] || new MediaStream([e.track]));
    pc.onicecandidate = (e) => { if (e.candidate) emit('call:signal', { data: { type: 'candidate', candidate: e.candidate } }); };
    pc.onconnectionstatechange = () => setConn(pc.connectionState);
    pcRef.current = pc;
    setConn('connecting');
    return pc;
  }, [info, emit]);

  const flushIce = async (pc) => {
    for (const c of pendingIce.current.splice(0)) await pc.addIceCandidate(c).catch(() => {});
  };

  // The doctor always makes the offer, the patient answers
  const makeOffer = useCallback(async () => {
    const pc = newPeer();
    await pc.setLocalDescription(await pc.createOffer());
    emit('call:signal', { data: { type: 'offer', sdp: pc.localDescription } });
  }, [newPeer, emit]);

  const finish = useCallback((by, durationSec) => {
    closePeer();
    joinedRef.current = false;
    localRef.current?.getTracks().forEach((t) => t.stop());
    screenRef.current?.stop();
    setEnded({ by, durationSec });
    setStage('ended');
  }, [closePeer]);

  useEffect(() => {
    if (!socket || !info) return undefined;
    const onState = (s) => setPresence(s);
    const onAdmitted = () => {
      setStage('call');
      if (!isDoctor) emit('call:ready');
    };
    const onPeerJoined = ({ who }) => {
      setPeerLeft(false);
      // the doctor came back: ask for a fresh connection
      if (!isDoctor && who === 'doctor' && stageRef.current === 'call') emit('call:ready');
    };
    const onPeerReady = () => { if (isDoctor) makeOffer().catch(() => toast.error('Could not connect the call')); };
    const onSignal = async ({ data }) => {
      try {
        if (data.type === 'offer') {
          const pc = newPeer();
          await pc.setRemoteDescription(data.sdp);
          await flushIce(pc);
          await pc.setLocalDescription(await pc.createAnswer());
          emit('call:signal', { data: { type: 'answer', sdp: pc.localDescription } });
        } else if (data.type === 'answer') {
          if (pcRef.current) { await pcRef.current.setRemoteDescription(data.sdp); await flushIce(pcRef.current); }
        } else if (data.type === 'candidate') {
          const pc = pcRef.current;
          if (pc?.remoteDescription) await pc.addIceCandidate(data.candidate).catch(() => {});
          else pendingIce.current.push(data.candidate);
        }
      } catch (e) { console.error('signal', e); }
    };
    const onPeerLeft = () => { setPeerLeft(true); closePeer(); };
    const onEnded = ({ by, durationSec }) => finish(by, durationSec);
    // After a network drop the socket reconnects: join the call again
    const onReconnect = () => {
      if (!joinedRef.current) return;
      emit('call:join', {}, (res) => { if (res?.ok && res.admitted && !isDoctor) emit('call:ready'); });
    };

    socket.on('call:state', onState);
    socket.on('call:admitted', onAdmitted);
    socket.on('call:peer-joined', onPeerJoined);
    socket.on('call:peer-ready', onPeerReady);
    socket.on('call:signal', onSignal);
    socket.on('call:peer-left', onPeerLeft);
    socket.on('call:ended', onEnded);
    socket.on('connect', onReconnect);
    return () => {
      socket.off('call:state', onState);
      socket.off('call:admitted', onAdmitted);
      socket.off('call:peer-joined', onPeerJoined);
      socket.off('call:peer-ready', onPeerReady);
      socket.off('call:signal', onSignal);
      socket.off('call:peer-left', onPeerLeft);
      socket.off('call:ended', onEnded);
      socket.off('connect', onReconnect);
    };
  }, [socket, info, isDoctor, emit, makeOffer, newPeer, closePeer, finish]);

  // Leaving the page = leaving the call (the patient can come back while it is open)
  useEffect(() => () => {
    if (joinedRef.current) socket?.emit('call:leave', { id });
    pcRef.current?.close();
  }, [socket, id]);

  // ---- Actions
  const join = () => {
    setJoining(true);
    emit('call:join', {}, (res) => {
      setJoining(false);
      if (!res?.ok) return toast.error(res?.reason || 'Could not join');
      joinedRef.current = true;
      if (res.admitted) {
        setStage('call');
        if (!isDoctor) emit('call:ready');
      } else setStage('waiting');
    });
  };

  const admit = () => emit('call:admit', {}, (res) => { if (!res?.ok) toast.error(res?.reason || 'Could not start'); });

  const toggleMic = () => {
    localRef.current?.getAudioTracks().forEach((t) => { t.enabled = !micOn; });
    setMicOn(!micOn);
  };
  const toggleCam = () => {
    const tracks = localRef.current?.getVideoTracks() || [];
    if (!tracks.length) return toast('No camera available, audio only');
    tracks.forEach((t) => { t.enabled = !camOn; });
    setCamOn(!camOn);
  };

  const stopShare = useCallback(() => {
    screenRef.current?.stop();
    screenRef.current = null;
    setSharing(false);
    const cam = localRef.current?.getVideoTracks()[0] || null;
    pcRef.current?.getSenders().find((s) => s.track?.kind === 'video' || s.track === null)?.replaceTrack(cam);
  }, []);

  const toggleShare = async () => {
    if (sharing) return stopShare();
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = display.getVideoTracks()[0];
      screenRef.current = track;
      track.onended = stopShare;
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(track);
      setSharing(true);
    } catch { /* user cancelled */ }
  };

  const reconnect = () => {
    setPeerLeft(false);
    if (isDoctor) makeOffer().catch(() => toast.error('Could not reconnect'));
    else emit('call:ready');
  };

  const leave = () => {
    emit('call:leave');
    joinedRef.current = false;
    navigate('/app/my-appointments');
  };

  const runConfirm = async () => {
    setBusy(true);
    try {
      if (confirm === 'end') emit('call:end', {}, (res) => { if (!res?.ok) toast.error(res?.reason || 'Could not end the call'); });
      if (confirm === 'no-show') {
        await api.post(`/calls/${id}/no-show`);
        toast.success('Marked as no-show');
        navigate('/app/doctor/appointments');
      }
      if (confirm === 'cancel') {
        await api.patch(`/appointments/${id}/cancel`);
        toast.success('Appointment cancelled. You can book another time at no cost.');
        navigate('/app/doctors');
      }
      setConfirm(null);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const openNotes = async () => {
    try { setNotesFor((await api.get(`/appointments/${id}`)).data); } catch (e) { toast.error(errMsg(e)); }
  };

  // ---- Render
  if (loadError) return <ErrorBox message={loadError} />;
  if (!info) return <PageLoader />;

  const a = info.appointment;
  const other = isDoctor ? a.patient : a.doctor;
  const t = Object.fromEntries(Object.entries(info.times || {}).map(([k, v]) => [k, new Date(v).getTime()]));
  const phase = info.state.phase;
  const canJoinNow = info.times && now >= t.opensAt && now <= t.closesAt;

  // Appointment that can never have a call (in-person, cancelled, not approved, or already over)
  if (stage === 'check' && !info.state.ok && phase !== 'early') {
    return (
      <CallShell onBack={() => navigate(-1)} title="Video consultation">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <VideoOff className="mx-auto size-10 text-slate-400" />
          <p className="mt-4 font-semibold">{info.state.reason}</p>
          <p className="mt-1 text-sm text-slate-500">{fmtDate(a.date)} · {fmtTime(a.startTime)}–{fmtTime(a.endTime)}</p>
        </Card>
      </CallShell>
    );
  }

  if (stage === 'ended') {
    const minutes = Math.round((ended?.durationSec || 0) / 60);
    return (
      <CallShell onBack={() => navigate(isDoctor ? '/app/doctor/appointments' : '/app/my-appointments')} title="Video consultation">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-50 text-violet-600"><PhoneOff className="size-7" /></span>
          <h2 className="mt-4 text-xl font-extrabold">Call ended</h2>
          <p className="mt-1 text-sm text-slate-500">
            {ended?.by === 'Time limit' ? 'The time for this appointment ran out.' : ended?.by === 'No-show' ? 'This appointment was marked as missed.' : ended?.by === 'Cancelled' ? 'This appointment was cancelled.' : `${isDoctor ? 'You' : a.doctor.fullName} ended the call.`}
            {minutes > 0 && ` Duration: ${minutes} min.`}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {isDoctor && a.status !== 'Cancelled' && <Button icon={Stethoscope} onClick={openNotes}>Write diagnosis &amp; prescription</Button>}
            {!isDoctor && <Button variant="secondary" onClick={() => navigate(`/app/appointments/${id}`)}>View appointment</Button>}
          </div>
          {!isDoctor && <p className="mt-4 text-xs text-slate-500">Your prescription will appear on the appointment page once the doctor writes it. The bill follows as usual.</p>}
        </Card>
        {notesFor && <DiagnosisModal appointment={notesFor} onClose={() => setNotesFor(null)} onSaved={() => navigate(`/app/appointments/${id}`)} />}
      </CallShell>
    );
  }

  // ---- Device check (before joining)
  if (stage === 'check') {
    return (
      <CallShell onBack={() => navigate(-1)} title="Video consultation" subtitle={`with ${other.fullName} · ${fmtDate(a.date)} · ${fmtTime(a.startTime)}–${fmtTime(a.endTime)}`}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-slate-900">
              {localStream && camOn ? <VideoView stream={localStream} muted mirror className="size-full object-cover" />
                : <div className="grid size-full place-items-center text-slate-400"><div className="text-center"><VideoOff className="mx-auto size-10" /><p className="mt-2 text-sm">Camera off</p></div></div>}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-linear-to-t from-black/60 to-transparent p-4">
                <RoundBtn on={micOn} onClick={toggleMic} icon={micOn ? Mic : MicOff} label={micOn ? 'Mute' : 'Unmute'} />
                <RoundBtn on={camOn} onClick={toggleCam} icon={camOn ? Video : VideoOff} label={camOn ? 'Camera off' : 'Camera on'} />
              </div>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-center gap-3 text-sm"><Mic className="size-4 text-slate-400" /><span className="text-slate-600">Microphone</span><MicMeter stream={localStream} /></div>
              {mediaNote && <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800"><TriangleAlert className="mt-0.5 size-4 shrink-0" />{mediaNote}</p>}
              <Button variant="secondary" size="sm" icon={RefreshCw} onClick={startMedia}>Test again</Button>
            </div>
          </Card>

          <Card className="flex flex-col p-6">
            <div className="flex items-center gap-3">
              <Avatar name={other.fullName} size="lg" />
              <div><p className="text-xs text-slate-500">{isDoctor ? 'Patient' : 'Doctor'}</p><p className="font-bold">{other.fullName}</p><p className="text-sm text-slate-500">{isDoctor ? [other.age && `${other.age} yrs`, other.gender].filter(Boolean).join(' · ') : other.specialization}</p></div>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><Clock className="mt-0.5 size-4 shrink-0 text-violet-500" />{fmtTime(a.startTime)}–{fmtTime(a.endTime)} · opens {clock(t.opensAt)}, closes {clock(t.closesAt)}</li>
              {isDoctor
                ? <li className="flex gap-2"><UserCheck className="mt-0.5 size-4 shrink-0 text-violet-500" />You can admit the patient from {clock(t.canAdmitAt)} (5 minutes early).</li>
                : <li className="flex gap-2"><UserCheck className="mt-0.5 size-4 shrink-0 text-violet-500" />Sit somewhere quiet and private. The doctor will let you in from the waiting room.</li>}
            </ul>
            <div className="mt-auto pt-6">
              {canJoinNow
                ? <Button size="lg" variant="video" className="w-full" icon={Video} loading={joining} disabled={!connected} onClick={join}>{isDoctor ? 'Enter call room' : 'Join waiting room'}</Button>
                : <Button size="lg" variant="secondary" className="w-full" icon={Hourglass} disabled>Opens at {clock(t.opensAt)} · in {mmss(t.opensAt - now)}</Button>}
              {!connected && <p className="mt-2 text-center text-xs text-amber-700">Connecting to the server…</p>}
            </div>
          </Card>
        </div>
      </CallShell>
    );
  }

  // ---- Waiting room
  if (stage === 'waiting') {
    const doctorLate = !isDoctor && now >= t.doctorLateAt;
    return (
      <CallShell onBack={() => { emit('call:leave'); joinedRef.current = false; navigate(-1); }} title="Waiting room" subtitle={`${fmtTime(a.startTime)}–${fmtTime(a.endTime)} · ${fmtDate(a.date)}`}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-slate-900">
              {localStream && camOn ? <VideoView stream={localStream} muted mirror className="size-full object-cover" />
                : <div className="grid size-full place-items-center text-slate-400"><VideoOff className="size-10" /></div>}
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 p-4">
                <RoundBtn on={micOn} onClick={toggleMic} icon={micOn ? Mic : MicOff} label="Microphone" />
                <RoundBtn on={camOn} onClick={toggleCam} icon={camOn ? Video : VideoOff} label="Camera" />
              </div>
            </div>
          </Card>

          <Card className="flex flex-col p-6">
            {isDoctor ? (<>
              <div className="flex items-center gap-3">
                <Avatar name={other.fullName} size="lg" />
                <div className="min-w-0 flex-1"><p className="font-bold">{other.fullName}</p>
                  {presence.patientPresent ? <Badge tone="emerald" dot>In the waiting room</Badge> : <Badge tone="slate" dot>Not joined yet</Badge>}
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">{now < t.startAt ? `Starts in ${mmss(t.startAt - now)}` : `Started ${mmss(now - t.startAt)} ago`}</p>
              {a.patient.contactNumber && <p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><Phone className="size-4" />If video fails, call {a.patient.contactNumber}</p>}
              <div className="mt-auto space-y-2 pt-6">
                <Button size="lg" variant="video" className="w-full" icon={UserCheck} onClick={admit} disabled={!presence.patientPresent || now < t.canAdmitAt}>
                  {now < t.canAdmitAt ? `You can start at ${clock(t.canAdmitAt)}` : 'Admit patient & start call'}
                </Button>
                {!presence.patientPresent && now >= t.noShowAt && (
                  <Button variant="dangerSoft" className="w-full" icon={UserX} onClick={() => setConfirm('no-show')}>Mark as no-show</Button>
                )}
                {!presence.patientPresent && now < t.noShowAt && now >= t.startAt && (
                  <p className="text-center text-xs text-slate-500">You can mark a no-show at {clock(t.noShowAt)} if the patient does not join.</p>
                )}
              </div>
            </>) : (<>
              <div className="flex items-center gap-3">
                <span className="relative grid size-12 place-items-center rounded-2xl bg-violet-50 text-violet-600"><Hourglass className="size-6" /><span className="absolute -right-1 -top-1 size-3 animate-ping rounded-full bg-violet-400" /></span>
                <div><p className="font-bold">Waiting for {a.doctor.fullName}</p><p className="text-sm text-slate-500">The doctor will let you in shortly. Please keep this page open.</p></div>
              </div>
              <p className="mt-5 text-sm text-slate-600">
                {now < t.startAt ? <>Your appointment starts in <b>{mmss(t.startAt - now)}</b>.</> : presence.doctorPresent ? 'The doctor is in the call room and will admit you soon.' : 'The doctor may be finishing with another patient.'}
              </p>
              <p className="mt-2 text-sm">{presence.doctorPresent ? <Badge tone="emerald" dot>Doctor online</Badge> : <Badge tone="slate" dot>Doctor not in the room yet</Badge>}</p>
              {doctorLate && (
                <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">The doctor is running late.</p>
                  <p className="mt-1">You can keep waiting, or cancel at no cost and book another time.</p>
                  <Button size="sm" variant="secondary" className="mt-3" onClick={() => setConfirm('cancel')}>Cancel &amp; book later</Button>
                </div>
              )}
            </>)}
          </Card>
        </div>
        <ConfirmDialog open={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={runConfirm} loading={busy} danger
          title={confirm === 'no-show' ? 'Mark as no-show?' : 'Cancel this appointment?'} confirmText={confirm === 'no-show' ? 'Mark no-show' : 'Yes, cancel'}
          message={confirm === 'no-show' ? `${other.fullName} did not join. The appointment will be cancelled and the patient notified.` : 'The appointment will be cancelled and you will not be charged. You can book a new time right away.'} />
      </CallShell>
    );
  }

  // ---- In the call
  const startedAt = presence.startedAt ? new Date(presence.startedAt).getTime() : t.startAt;
  const inGrace = now > t.endAt;
  const showWarning = isDoctor && now >= t.warnAt && now < t.endAt;
  const trouble = conn === 'disconnected' || conn === 'failed';

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[480px] flex-col overflow-hidden rounded-3xl bg-slate-950 text-white lg:h-[calc(100dvh-8rem)]">
      {/* top bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <Avatar name={other.fullName} size="sm" />
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{other.fullName}</p><p className="text-xs text-white/60">{isDoctor ? 'Patient' : a.doctor.specialization}</p></div>
        <span className="rounded-lg bg-white/10 px-2.5 py-1 font-mono text-sm">{mmss(now - startedAt)}</span>
        {showWarning && <span className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300">{Math.ceil((t.endAt - now) / 60000)} min left</span>}
        {inGrace && <span className={cx('rounded-lg px-2.5 py-1 text-xs font-semibold', t.closesAt - now < 60000 ? 'bg-rose-500/30 text-rose-200' : 'bg-amber-500/20 text-amber-300')}>Extra time: closes in {mmss(t.closesAt - now)}</span>}
      </div>

      <div className="relative flex min-h-0 flex-1">
        {/* remote video */}
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl bg-slate-900 mx-2">
          {remoteStream ? <VideoView stream={remoteStream} className="size-full object-contain" />
            : (
              <div className="grid size-full place-items-center text-center text-white/70">
                <div>
                  <Avatar name={other.fullName} size="lg" className="mx-auto" />
                  <p className="mt-3 text-sm">{peerLeft ? `${other.fullName} left the call. Waiting for them to rejoin…` : 'Connecting…'}</p>
                </div>
              </div>
            )}
          {trouble && (
            <div className="absolute inset-x-0 top-3 mx-auto flex w-fit max-w-[90%] flex-wrap items-center justify-center gap-2 rounded-xl bg-rose-600/90 px-3 py-2 text-sm">
              <WifiOff className="size-4" /> Connection lost.
              <button className="font-semibold underline cursor-pointer" onClick={reconnect}>Reconnect</button>
              <span className="text-white/80">Weak internet? Turn your camera off to keep the audio clear.</span>
            </div>
          )}
          {/* local preview */}
          <div className="absolute bottom-3 right-3 aspect-video w-32 overflow-hidden rounded-xl border border-white/20 bg-slate-800 shadow-lg sm:w-48">
            {sharing ? <div className="grid size-full place-items-center text-xs text-white/70">Sharing your screen</div>
              : localStream && camOn ? <VideoView stream={localStream} muted mirror className="size-full object-cover" />
              : <div className="grid size-full place-items-center"><VideoOff className="size-5 text-white/50" /></div>}
          </div>
        </div>

        {chatOpen && (
          <div className="absolute inset-0 z-10 flex flex-col bg-white text-slate-800 sm:static sm:mr-2 sm:w-80 sm:rounded-2xl">
            <CallChat otherId={other._id} otherName={other.fullName} onClose={() => setChatOpen(false)} />
          </div>
        )}
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-4">
        <RoundBtn on={micOn} onClick={toggleMic} icon={micOn ? Mic : MicOff} label={micOn ? 'Mute' : 'Unmute'} />
        <RoundBtn on={camOn} onClick={toggleCam} icon={camOn ? Video : VideoOff} label={camOn ? 'Turn camera off (audio only)' : 'Turn camera on'} />
        {isDoctor && navigator.mediaDevices?.getDisplayMedia && (
          <RoundBtn on={!sharing} onClick={toggleShare} icon={sharing ? ScreenShareOff : ScreenShare} label={sharing ? 'Stop sharing' : 'Share screen'} />
        )}
        <RoundBtn on={!chatOpen} onClick={() => setChatOpen(!chatOpen)} icon={MessageSquare} label="Chat" />
        <RoundBtn on onClick={reconnect} icon={RefreshCw} label="Reconnect" />
        {isDoctor
          ? <button onClick={() => setConfirm('end')} className="flex h-12 items-center gap-2 rounded-full bg-rose-600 px-5 font-semibold hover:bg-rose-700 cursor-pointer"><PhoneOff className="size-5" />End call</button>
          : <button onClick={leave} className="flex h-12 items-center gap-2 rounded-full bg-rose-600 px-5 font-semibold hover:bg-rose-700 cursor-pointer"><PhoneOff className="size-5" />Leave</button>}
      </div>
      {isDoctor && a.patient.contactNumber && <p className="pb-3 text-center text-xs text-white/50"><Phone className="mr-1 inline size-3" />If video keeps failing, call the patient: {a.patient.contactNumber}</p>}

      <ConfirmDialog open={confirm === 'end'} onClose={() => setConfirm(null)} onConfirm={runConfirm} loading={busy} danger
        title="End the call?" confirmText="End call"
        message="The call will close for both of you. Then write the diagnosis and prescription as usual." />
    </div>
  );
}

function CallShell({ title, subtitle, onBack, children }) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" icon={ArrowLeft} onClick={onBack}>Back</Button>
        <div className="min-w-0"><h1 className="truncate text-xl font-extrabold">{title}</h1>{subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}</div>
      </div>
      {children}
    </div>
  );
}

function VideoView({ stream, muted, mirror, className }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream || null; }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} className={cx(className, mirror && '-scale-x-100')} />;
}

function RoundBtn({ on, onClick, icon: Icon, label }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label}
      className={cx('grid size-12 place-items-center rounded-full transition cursor-pointer', on ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-slate-900 hover:bg-slate-200')}>
      <Icon className="size-5" />
    </button>
  );
}

/** Live microphone level, so people can see their mic works before joining. */
function MicMeter({ stream }) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    const track = stream?.getAudioTracks()[0];
    if (!track || !window.AudioContext) return undefined;
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    ctx.createMediaStreamSource(new MediaStream([track])).connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf;
    const loop = () => {
      analyser.getByteFrequencyData(data);
      setLevel(Math.min(1, data.reduce((s, v) => s + v, 0) / data.length / 50));
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); ctx.close(); };
  }, [stream]);
  return (
    <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
      <span className="block h-full rounded-full bg-emerald-500 transition-[width] duration-100" style={{ width: `${Math.round(level * 100)}%` }} />
    </span>
  );
}

/** The normal doctor–patient chat, shown next to the video. */
function CallChat({ otherId, otherName, onClose }) {
  const { user } = useAuth();
  const { socket } = useRealtime();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    api.get(`/messages/${otherId}`).then(({ data }) => setMsgs(data)).catch(() => {});
  }, [otherId]);

  useEffect(() => {
    if (!socket) return undefined;
    const onMsg = (m) => {
      const mine = String(m.from) === String(user._id) && String(m.to) === String(otherId);
      const theirs = String(m.from) === String(otherId) && String(m.to) === String(user._id);
      if (mine || theirs) setMsgs((l) => (l.some((x) => x._id === m._id) ? l : [...l, m]));
    };
    socket.on('chat:message', onMsg);
    return () => socket.off('chat:message', onMsg);
  }, [socket, otherId, user._id]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs]);

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    try { await api.post(`/messages/${otherId}`, { text: body }); } catch (err) { toast.error(errMsg(err)); setText(body); }
  };

  return (<>
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <p className="text-sm font-bold">Chat with {otherName}</p>
      <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 cursor-pointer" aria-label="Close chat"><X className="size-4" /></button>
    </div>
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
      {msgs.slice(-50).map((m) => {
        const mine = String(m.from) === String(user._id);
        return <p key={m._id} className={cx('max-w-[85%] rounded-2xl px-3 py-2 text-sm', mine ? 'ml-auto bg-brand-600 text-white' : 'bg-slate-100')}>{m.text}</p>;
      })}
      <div ref={endRef} />
    </div>
    <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-3">
      <input className="input flex-1" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
      <Button type="submit" icon={Send} aria-label="Send" />
    </form>
  </>);
}
