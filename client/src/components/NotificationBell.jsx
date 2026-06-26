import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CalendarClock, Pill, Star, Info } from 'lucide-react';
import api from '../api/client';

const ICONS = { appointment: CalendarClock, prescription: Pill, review: Star, info: Info };

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const loadCount = () => api.get('/notifications/unread-count').then(({ data }) => setUnread(data.unread)).catch(() => {});
  const loadAll = () => api.get('/notifications').then(({ data }) => { setItems(data.notifications); setUnread(data.unread); }).catch(() => {});

  useEffect(() => {
    loadCount();
    const t = setInterval(loadCount, 30000); // poll unread count
    return () => clearInterval(t);
  }, []);

  // close on outside click
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadAll();
  };

  const openItem = async (n) => {
    if (!n.read) {
      api.patch(`/notifications/${n._id}/read`).catch(() => {});
      setItems((arr) => arr.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const markAll = () => {
    api.patch('/notifications/read-all').catch(() => {});
    setItems((arr) => arr.map((x) => ({ ...x, read: true })));
    setUnread(0);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} aria-label="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-ink-soft transition-colors hover:text-brand-600">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
            style={{ height: 18 }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[88vw] animate-scale-in overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-glow)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-semibold text-ink">Notifications</p>
            {items.some((n) => !n.read) && (
              <button onClick={markAll} className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                <Check size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-ink-soft">
                <Bell size={26} className="mx-auto mb-2 text-faint" />
                You're all caught up.
              </div>
            ) : (
              items.map((n) => {
                const Icon = ICONS[n.type] || Info;
                return (
                  <button key={n._id} onClick={() => openItem(n)}
                    className={`flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition-colors hover:bg-mist ${n.read ? '' : 'bg-brand-50/50'}`}>
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{n.title}</span>
                      {n.message && <span className="block text-xs text-ink-soft">{n.message}</span>}
                      <span className="mt-0.5 block text-[11px] text-faint">{timeAgo(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
