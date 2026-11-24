import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api, { tokenStore } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

const RealtimeContext = createContext(null);

/** Live connection: notifications, unread message count and the raw socket for chat. */
export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [msgUnread, setMsgUnread] = useState(0);
  const userRef = useRef(user);
  userRef.current = user;

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications', { params: { limit: 30 } });
      setNotifications(data.items);
      setUnread(data.unread);
    } catch { /* ignore */ }
  }, []);

  const refreshMsgUnread = useCallback(async () => {
    if (!['Doctor', 'Patient'].includes(userRef.current?.role)) return;
    try { setMsgUnread((await api.get('/messages/unread-count')).data.count); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    loadNotifications();
    refreshMsgUnread();

    const s = io(import.meta.env.VITE_SOCKET_URL || '/', { auth: { token: tokenStore.get() }, transports: ['websocket', 'polling'] });
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('notification', (n) => {
      setNotifications((list) => [n, ...list].slice(0, 30));
      setUnread((c) => c + 1);
      if (n.type !== 'message') {
        (n.priority === 'high' ? toast.error : toast)(`${n.title}${n.message ? ` · ${n.message.slice(0, 80)}` : ''}`, { duration: 5000, icon: n.priority === 'high' ? '⚠️' : '🔔' });
      }
    });
    s.on('chat:message', (m) => {
      if (String(m.to) === String(userRef.current?._id)) setMsgUnread((c) => c + 1);
    });
    setSocket(s);
    return () => { s.disconnect(); setSocket(null); setConnected(false); };
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = useCallback(async (id) => {
    setNotifications((l) => l.map((n) => (n._id === id && !n.read ? { ...n, read: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
    try { await api.patch(`/notifications/${id}/read`); } catch { /* ignore */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((l) => l.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try { await api.patch('/notifications/read-all'); } catch { /* ignore */ }
  }, []);

  const value = useMemo(() => ({
    socket, connected, notifications, unread, markRead, markAllRead, msgUnread, refreshMsgUnread, reloadNotifications: loadNotifications,
  }), [socket, connected, notifications, unread, markRead, markAllRead, msgUnread, refreshMsgUnread, loadNotifications]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useRealtime = () => useContext(RealtimeContext);
