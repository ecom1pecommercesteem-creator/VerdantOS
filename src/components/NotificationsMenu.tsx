import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatRelative } from '../lib/format';
import { isOverdue } from '../lib/ticket';
import { useNow } from '../lib/useNow';
import { useStore } from '../state/useStore';

export function NotificationsMenu() {
  const { data, currentAgent, actions } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const now = useNow();
  // Alerts follow the tickets themselves, so they always agree with the dashboard's past-SLA count.
  const overdue = data.settings.notifySlaBreach ? data.tickets.filter((t) => isOverdue(t, now)) : [];
  const mine = data.notifications.filter((n) => !n.recipientId || n.recipientId === currentAgent?.id);
  const unread = mine.filter((n) => !n.read).length + overdue.length;

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Notifications, ${unread} unread`}
        className="relative inline-flex size-12 items-center justify-center rounded-full bg-panel text-body hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Bell className="size-[18px]" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white tabular-nums">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-36 z-20 overflow-hidden rounded-2xl border border-line bg-panel shadow-lg sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <button
              type="button"
              onClick={actions.markAllNotificationsRead}
              disabled={mine.every((n) => n.read)}
              className="text-xs font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:text-subtle disabled:no-underline"
            >
              Mark all as read
            </button>
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {overdue.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  to={`/tickets/${ticket.id}`}
                  onClick={() => setOpen(false)}
                  className="flex w-full gap-3 px-4 py-3 text-left hover:bg-canvas"
                >
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">Reply overdue</span>
                    <span className="mt-0.5 block text-sm text-muted">{ticket.id} {ticket.subject}</span>
                  </span>
                </Link>
              </li>
            ))}
            {mine.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    actions.markNotificationRead(n.id);
                    setOpen(false);
                    if (n.ticketId) navigate(`/tickets/${n.ticketId}`);
                  }}
                  className="flex w-full gap-3 px-4 py-3 text-left hover:bg-canvas"
                >
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-accent'}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{n.title}</span>
                    <span className="mt-0.5 block text-sm text-muted">{n.body}</span>
                    <span className="mt-1 block text-xs text-subtle">{formatRelative(n.createdAt, now)}</span>
                  </span>
                </button>
              </li>
            ))}
            {mine.length === 0 && overdue.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted">You are all caught up.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
