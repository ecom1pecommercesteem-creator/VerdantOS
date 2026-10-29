import { ArrowLeft, Bug, CheckCircle2, ChevronDown, RotateCcw } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { customers, orders } from '../data/seed';
import { AVAILABILITY_LABELS } from '../lib/agents';
import { ESCALATION_STATUS_LABELS, isDeveloper } from '../lib/escalation';
import { formatDateTime, formatDuration, formatRelative } from '../lib/format';
import { REPLY_TEMPLATES } from '../lib/templates';
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, STATUS_ORDER, PRIORITY_ORDER, getResponseDueAt, minutesUntilDue } from '../lib/ticket';
import type { StoreActions } from '../state/store';
import type { Agent, Escalation, Ticket, TicketPriority, TicketStatus } from '../types';
import { EscalateForm } from './EscalateForm';
import { Avatar, Button, OrderStatusBadge, SelectField } from './ui';

interface TicketDetailProps {
  ticket: Ticket;
  agents: Agent[];
  escalations: Escalation[]; // the ones raised from this ticket
  actions: StoreActions;
  now: Date;
  timeZone: string;
  draft: string; // the unsent reply, kept by the page so it survives opening another ticket
  onDraftChange: (draft: string) => void;
  workload: Record<string, number>; // active tickets per agent id
  otherActive: number; // the customer's other unresolved tickets
}

type TimelineItem =
  | { kind: 'message'; key: string; at: string; message: Ticket['messages'][number] }
  | { kind: 'note'; key: string; at: string; note: Ticket['notes'][number] }
  | { kind: 'activity'; key: string; at: string; text: string };

export function TicketDetail({ ticket, agents, escalations, actions, now, timeZone, draft, onDraftChange, workload, otherActive }: TicketDetailProps) {
  const location = useLocation();
  const customer = customers.find((c) => c.id === ticket.customerId);
  const order = orders.find((o) => o.id === ticket.orderId);
  // History keeps the person's name after they leave; only the assignee box falls back to "Unassigned".
  const nameOf = (id: string | null | undefined, fallback: string) => agents.find((a) => a.id === id)?.name ?? fallback;
  const [error, setError] = useState<string | null>(null);
  const [escalating, setEscalating] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const developers = agents.filter(isDeveloper);
  const resolved = ticket.status === 'resolved';
  const dueAt = getResponseDueAt(ticket);
  const minutesLeft = minutesUntilDue(ticket, now);
  const firstName = customer?.name.split(' ')[0] ?? 'there';

  const timeline: TimelineItem[] = [
    ...ticket.messages.map((message) => ({ kind: 'message' as const, key: message.id, at: message.createdAt, message })),
    ...ticket.notes.map((note) => ({ kind: 'note' as const, key: note.id, at: note.createdAt, note })),
    ...ticket.activity.map((event) => ({ kind: 'activity' as const, key: event.id, at: event.createdAt, text: event.text })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  // Open on the newest message, and follow the thread as it grows.
  useLayoutEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [timeline.length]);

  function submit(kind: 'reply' | 'note') {
    if (!draft.trim()) {
      setError(kind === 'reply' ? 'Write a reply before sending.' : 'Write a note before adding it.');
      return;
    }
    if (kind === 'reply') {
      if (resolved) {
        setError('Reopen this ticket to reply to the customer.');
        return;
      }
      actions.replyToTicket(ticket.id, draft);
    } else {
      actions.addInternalNote(ticket.id, draft);
    }
    onDraftChange('');
    setError(null);
  }

  function insertTemplate(label: string) {
    const template = REPLY_TEMPLATES.find((t) => t.label === label);
    if (!template) return;
    const text = template.body.replace('{name}', firstName);
    onDraftChange(draft.trim() ? `${draft.trimEnd()}\n\n${text}` : text);
    setError(null);
  }

  return (
    <article className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-line px-4 py-3 sm:px-6 sm:py-4">
        <Link
          to={{ pathname: '/tickets', search: location.search }}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent lg:hidden"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Inbox
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 lg:flex-nowrap">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar name={customer?.name ?? 'Unknown'} />
            <div className="min-w-0">
              <p className="flex min-w-0 items-baseline gap-x-2">
                {customer ? (
                  <Link to={`/customers/${customer.id}`} className="shrink-0 text-sm font-semibold hover:text-accent hover:underline">{customer.name}</Link>
                ) : (
                  <span className="shrink-0 text-sm font-semibold">Unknown customer</span>
                )}
                <span className="truncate text-sm text-muted">{customer?.email}</span>
              </p>
              <p className="truncate text-xs text-muted">
                {ticket.id} · {CATEGORY_LABELS[ticket.category]} · Opened {formatDateTime(ticket.createdAt, timeZone)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button onClick={() => setShowControls((open) => !open)} aria-expanded={showControls} className="lg:hidden">
              Details
              <ChevronDown className={`size-4 transition-transform ${showControls ? 'rotate-180' : ''}`} aria-hidden="true" />
            </Button>
            <Button onClick={() => setEscalating((open) => !open)} aria-expanded={escalating}>
              <Bug className="size-4" aria-hidden="true" />
              Escalate
            </Button>
            {resolved ? (
              <Button onClick={() => actions.updateTickets([ticket.id], { status: 'open' })}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Reopen
              </Button>
            ) : (
              <Button variant="primary" onClick={() => actions.updateTickets([ticket.id], { status: 'resolved' })}>
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Resolve
              </Button>
            )}
          </div>
        </div>
        <div className={`${showControls ? 'grid' : 'hidden'} mt-3 grid-cols-1 gap-2 sm:grid-cols-3 lg:grid`}>
          <SelectField label="Ticket status" className="w-full" value={ticket.status} onChange={(e) => actions.updateTickets([ticket.id], { status: e.target.value as TicketStatus })}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </SelectField>
          <SelectField label="Ticket priority" className="w-full" value={ticket.priority} onChange={(e) => actions.updateTickets([ticket.id], { priority: e.target.value as TicketPriority })}>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </SelectField>
          <SelectField label="Assigned agent" className="w-full" value={ticket.assigneeId ?? ''} onChange={(e) => actions.updateTickets([ticket.id], { assigneeId: e.target.value || null })}>
            <option value="">Unassigned</option>
            {agents.filter((a) => !isDeveloper(a)).map((a) => (
              <option key={a.id} value={a.id}>{a.name} · {AVAILABILITY_LABELS[a.availability]} · {workload[a.id] ?? 0} active</option>
            ))}
          </SelectField>
        </div>
        <h2 className="mt-3 text-lg font-semibold">{ticket.subject}</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span>Updated {formatRelative(ticket.updatedAt, now)}</span>
          {ticket.orderId && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-body">Order {ticket.orderId}</span>
              {order && <OrderStatusBadge status={order.status} />}
              {order?.trackingNumber && <span className="hidden sm:inline">{order.carrier} {order.trackingNumber}</span>}
            </>
          )}
          {otherActive > 0 && customer && (
            <>
              <span aria-hidden="true">·</span>
              <Link to={`/customers/${customer.id}`} className="font-medium text-accent hover:underline">
                {otherActive} other active {otherActive === 1 ? 'ticket' : 'tickets'} from this customer
              </Link>
            </>
          )}
        </p>
        {dueAt && minutesLeft !== null && (
          <p className={`mt-1 text-xs font-medium ${minutesLeft < 0 ? 'text-red-600' : minutesLeft <= 60 ? 'text-amber-700' : 'text-muted'}`}>
            {minutesLeft < 0
              ? `Reply was due ${formatDateTime(dueAt.toISOString(), timeZone)}`
              : `Reply due in ${formatDuration(minutesLeft)} (${formatDateTime(dueAt.toISOString(), timeZone)})`}
          </p>
        )}
        {escalations.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Issues sent to developers">
            {escalations.map((item) => (
              <li key={item.id}>
                <Link to="/developers" className="inline-flex items-center gap-1.5 rounded-lg bg-canvas px-2.5 py-1 text-xs font-medium text-body hover:bg-accent-soft">
                  <Bug className="size-3.5" aria-hidden="true" />
                  {item.id} · {ESCALATION_STATUS_LABELS[item.status]} · {item.assigneeId ? nameOf(item.assigneeId, 'Former team member') : 'No developer yet'}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>

      <div ref={threadRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
        {escalating && (
          <EscalateForm
            ticket={ticket}
            developers={developers}
            onSubmit={(escalation) => {
              actions.createEscalation(escalation);
              setEscalating(false);
            }}
            onCancel={() => setEscalating(false)}
          />
        )}
        <ol className="flex flex-col gap-6">
          {timeline.map((item) => {
            if (item.kind === 'activity') {
              return (
                <li key={item.key} className="flex items-center gap-3 text-xs text-muted">
                  <span className="h-px flex-1 bg-line" aria-hidden="true" />
                  <span>
                    {item.text} · {formatRelative(item.at, now)}
                  </span>
                  <span className="h-px flex-1 bg-line" aria-hidden="true" />
                </li>
              );
            }
            if (item.kind === 'note') {
              return (
                <li key={item.key} className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold text-amber-800">
                    Internal note by {nameOf(item.note.agentId, 'Former team member')} · visible to your team only
                  </p>
                  <p className="mt-1.5 text-sm whitespace-pre-line text-amber-950">{item.note.body}</p>
                </li>
              );
            }
            const { message } = item;
            const fromAgent = message.author === 'agent';
            const name = fromAgent ? nameOf(message.agentId, 'Former team member') : customer?.name ?? 'Customer';
            return (
              <li key={item.key} className="flex gap-3">
                <Avatar name={name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-semibold">{name}</span>
                    <span className="text-xs text-muted">{fromAgent ? 'Agent reply' : 'Customer'} · {formatDateTime(message.createdAt, timeZone)}</span>
                  </div>
                  <p
                    className={`mt-2 rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                      fromAgent ? 'bg-accent-soft text-ink' : 'bg-canvas text-body'
                    }`}
                  >
                    {message.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <footer className="border-t border-line px-4 py-3 sm:px-6">
        <label htmlFor="ticket-composer" className="sr-only">
          Reply to the customer or add an internal note
        </label>
        <textarea
          id="ticket-composer"
          value={draft}
          onChange={(e) => {
            onDraftChange(e.target.value);
            if (error) setError(null);
          }}
          rows={2}
          placeholder={resolved ? 'This ticket is resolved. Reopen it to reply.' : 'Write a reply or internal note…'}
          aria-invalid={error ? true : undefined}
          aria-describedby="composer-help"
          className="w-full resize-none rounded-2xl border border-line bg-panel px-4 py-3 text-sm outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-accent aria-[invalid=true]:border-red-400"
        />
        <p id="composer-help" className="sr-only">Replies are saved to the ticket thread. Internal notes are visible to your team only.</p>
        {error && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {!resolved && (
            <SelectField label="Insert a template" className="w-32" value="" onChange={(e) => insertTemplate(e.target.value)}>
              <option value="">Templates</option>
              {REPLY_TEMPLATES.map((t) => (
                <option key={t.label} value={t.label}>{t.label}</option>
              ))}
            </SelectField>
          )}
          {!resolved && (
            <button
              type="button"
              onClick={() => actions.simulateCustomerReply(ticket.id)}
              title="Demo only: adds a message from the customer" aria-label="Simulate customer reply"
              className="hidden text-xs font-medium text-muted underline-offset-2 hover:text-ink sm:inline hover:underline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Simulate reply
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <Button onClick={() => submit('note')}>Add Note</Button>
            <Button variant="primary" onClick={() => submit('reply')} disabled={resolved}>
              Reply
            </Button>
          </div>
        </div>
      </footer>
    </article>
  );
}
