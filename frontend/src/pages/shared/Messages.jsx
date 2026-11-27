import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Send, MessageCircle, ArrowLeft, Search, FileHeart, Check, CheckCheck } from 'lucide-react';
import api, { errMsg } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useRealtime } from '@/context/RealtimeContext';
import { Avatar, Card, EmptyState, PageHeader, Spinner, cx } from '@/components/ui';
import { timeAgo } from '@/components/layout/NotificationBell';

const dayLabel = (d) => {
  const x = new Date(d); const t = new Date();
  const y = new Date(); y.setDate(t.getDate() - 1);
  if (x.toDateString() === t.toDateString()) return 'Today';
  if (x.toDateString() === y.toDateString()) return 'Yesterday';
  return x.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

export default function Messages() {
  const { user } = useAuth();
  const { socket, refreshMsgUnread } = useRealtime();
  const [params, setParams] = useSearchParams();
  const activeId = params.get('with');
  const [contacts, setContacts] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [filter, setFilter] = useState('');
  const endRef = useRef(null);
  const typingTimer = useRef(null);
  const lastTypingSent = useRef(0);

  const loadContacts = useCallback(async () => {
    try { setContacts((await api.get('/messages/contacts')).data); } catch (e) { toast.error(errMsg(e)); setContacts([]); }
  }, []);
  useEffect(() => { loadContacts(); }, [loadContacts]);

  useEffect(() => {
    if (!activeId) return;
    setLoadingMsgs(true);
    api.get(`/messages/${activeId}`)
      .then(({ data }) => { setMsgs(data); refreshMsgUnread(); setContacts((c) => c?.map((x) => (x._id === activeId ? { ...x, unread: 0 } : x))); })
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoadingMsgs(false));
  }, [activeId, refreshMsgUnread]);

  // Live updates
  useEffect(() => {
    if (!socket) return undefined;
    const onMsg = (m) => {
      const other = String(m.from) === String(user._id) ? String(m.to) : String(m.from);
      if (other === activeId) {
        setMsgs((l) => (l.some((x) => x._id === m._id) ? l : [...l, m]));
        if (String(m.to) === String(user._id)) api.get(`/messages/${activeId}`).then(() => refreshMsgUnread()).catch(() => {});
        setTyping(false);
      }
      setContacts((c) => {
        if (!c) return c;
        const list = c.map((x) => (x._id === other ? {
          ...x, lastMessage: { text: m.text, at: m.createdAt, mine: String(m.from) === String(user._id) },
          unread: other === activeId || String(m.from) === String(user._id) ? x.unread : x.unread + 1,
        } : x));
        return list.sort((a, b) => new Date(b.lastMessage?.at || 0) - new Date(a.lastMessage?.at || 0));
      });
    };
    const onTyping = ({ from }) => {
      if (from !== activeId) return;
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 2500);
    };
    const onRead = ({ by }) => { if (by === activeId) setMsgs((l) => l.map((m) => (String(m.from) === String(user._id) ? { ...m, read: true } : m))); };
    socket.on('chat:message', onMsg);
    socket.on('chat:typing', onTyping);
    socket.on('chat:read', onRead);
    return () => { socket.off('chat:message', onMsg); socket.off('chat:typing', onTyping); socket.off('chat:read', onRead); };
  }, [socket, activeId, user._id, refreshMsgUnread]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs, typing]);

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      const { data } = await api.post(`/messages/${activeId}`, { text: body });
      setMsgs((l) => (l.some((x) => x._id === data._id) ? l : [...l, data]));
      setText('');
    } catch (err) { toast.error(errMsg(err)); } finally { setSending(false); }
  };

  const onType = (v) => {
    setText(v);
    if (socket && Date.now() - lastTypingSent.current > 1500) {
      socket.emit('chat:typing', { to: activeId });
      lastTypingSent.current = Date.now();
    }
  };

  const active = contacts?.find((c) => c._id === activeId);
  const shown = useMemo(() => (contacts || []).filter((c) => c.fullName.toLowerCase().includes(filter.toLowerCase())), [contacts, filter]);
  const grouped = useMemo(() => {
    const out = [];
    let last = '';
    for (const m of msgs) {
      const label = dayLabel(m.createdAt);
      if (label !== last) { out.push({ divider: label, key: `d-${m._id}` }); last = label; }
      out.push(m);
    }
    return out;
  }, [msgs]);

  if (!contacts) return <div className="grid place-items-center py-20"><Spinner /></div>;

  return (
    <>
      <PageHeader title="Messages" subtitle={user.role === 'Doctor' ? 'Secure chat with your patients' : 'Secure chat with your doctors'} />
      <Card className="flex h-[calc(100vh-220px)] min-h-[480px] overflow-hidden">
        {/* Contacts */}
        <aside className={cx('flex w-full flex-col border-r border-slate-100 md:w-80', activeId && 'hidden md:flex')}>
          <div className="border-b border-slate-100 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input className="input py-2 pl-9" placeholder="Search…" value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {shown.length === 0 && <li className="p-6 text-center text-sm text-slate-500">{contacts.length ? 'No match' : user.role === 'Doctor' ? 'Patients you have appointments with appear here.' : 'Book an appointment to chat with a doctor.'}</li>}
            {shown.map((c) => (
              <li key={c._id}>
                <button onClick={() => setParams({ with: c._id })}
                  className={cx('flex w-full items-center gap-3 px-4 py-3 text-left transition cursor-pointer', c._id === activeId ? 'bg-brand-50' : 'hover:bg-slate-50')}>
                  <Avatar name={c.fullName} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cx('truncate text-sm', c.unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700')}>{c.fullName}</span>
                      {c.lastMessage && <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(c.lastMessage.at)}</span>}
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className={cx('truncate text-xs', c.unread ? 'font-medium text-slate-700' : 'text-slate-500')}>
                        {c.lastMessage ? `${c.lastMessage.mine ? 'You: ' : ''}${c.lastMessage.text}` : c.specialization || 'Start a conversation'}
                      </span>
                      {c.unread > 0 && <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Conversation */}
        <section className={cx('flex min-w-0 flex-1 flex-col', !activeId && 'hidden md:flex')}>
          {!active ? (
            <div className="grid flex-1 place-items-center"><EmptyState icon={MessageCircle} title="Select a conversation" message="Messages are private between you and your care team." /></div>
          ) : (<>
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
              <button className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden" onClick={() => setParams({})} aria-label="Back"><ArrowLeft className="size-5" /></button>
              <Avatar name={active.fullName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{active.fullName}</p>
                <p className="text-xs text-slate-500">{typing ? <span className="text-brand-600">typing…</span> : active.specialization || active.role}</p>
              </div>
              {user.role === 'Doctor' && (
                <Link to={`/app/patients/${active._id}`} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"><FileHeart className="size-4" />Record</Link>
              )}
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50/60 px-4 py-4">
              {loadingMsgs ? <div className="grid h-full place-items-center"><Spinner /></div> : grouped.length === 0 ? (
                <p className="grid h-full place-items-center text-sm text-slate-500">Say hello to start the conversation</p>
              ) : grouped.map((m) => m.divider ? (
                <div key={m.key} className="py-2 text-center"><span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">{m.divider}</span></div>
              ) : (
                <div key={m._id} className={cx('flex', String(m.from) === String(user._id) ? 'justify-end' : 'justify-start')}>
                  <div className={cx('max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
                    String(m.from) === String(user._id) ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md bg-white text-slate-800')}>
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    <p className={cx('mt-0.5 flex items-center justify-end gap-1 text-[10px]', String(m.from) === String(user._id) ? 'text-white/70' : 'text-slate-400')}>
                      {new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      {String(m.from) === String(user._id) && (m.read ? <CheckCheck className="size-3" /> : <Check className="size-3" />)}
                    </p>
                  </div>
                </div>
              ))}
              {typing && <div className="flex"><span className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm"><span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 120}ms` }} />)}</span></span></div>}
              <div ref={endRef} />
            </div>
            <form onSubmit={send} className="flex items-end gap-2 border-t border-slate-100 p-3">
              <textarea rows={1} className="input max-h-32 resize-none" placeholder="Write a message…" value={text}
                onChange={(e) => onType(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }} />
              <button type="submit" disabled={!text.trim() || sending} aria-label="Send"
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-50 cursor-pointer">
                {sending ? <Spinner className="size-4 text-white" /> : <Send className="size-4" />}
              </button>
            </form>
          </>)}
        </section>
      </Card>
    </>
  );
}
