import { buildSeed, customers } from '../data/seed';
import { ESCALATION_STATUS_LABELS } from '../lib/escalation';
import { PRIORITY_LABELS, STATUS_LABELS } from '../lib/ticket';
import type {
  ActivityEvent,
  Agent,
  AgentAvailability,
  AppData,
  Escalation,
  EscalationStatus,
  InternalNote,
  Message,
  NotificationItem,
  Ticket,
  TicketPriority,
  TicketStatus,
  WorkspaceSettings,
} from '../types';

export type NewAgent = Pick<Agent, 'name' | 'email' | 'role' | 'passwordHash'>;

export type NewEscalation = Pick<Escalation, 'ticketId' | 'title' | 'description' | 'severity' | 'assigneeId'>;

export interface EscalationChanges {
  status?: EscalationStatus;
  assigneeId?: string | null;
}

export interface TicketChanges {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
}

export type Action =
  | { type: 'tickets/update'; ticketIds: string[]; changes: TicketChanges; actorId: string; at: string }
  | { type: 'tickets/reply'; ticketId: string; body: string; agentId: string; at: string }
  | { type: 'tickets/note'; ticketId: string; body: string; agentId: string; at: string }
  | { type: 'tickets/customerReply'; ticketId: string; body: string; at: string }
  | { type: 'escalations/create'; escalation: NewEscalation; actorId: string; at: string }
  | { type: 'escalations/update'; escalationId: string; changes: EscalationChanges; actorId: string; at: string }
  | { type: 'agents/availability'; agentId: string; availability: AgentAvailability; actorId: string }
  | { type: 'agents/add'; agent: NewAgent; actorId: string }
  | { type: 'agents/remove'; agentId: string; actorId: string; at: string }
  | { type: 'settings/update'; patch: Partial<WorkspaceSettings> }
  | { type: 'notifications/read'; id: string }
  | { type: 'notifications/readAll' }
  | { type: 'data/reset'; at: string };

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const MAX_NOTIFICATIONS = 30;

type NewNotification = Pick<NotificationItem, 'title' | 'body' | 'ticketId' | 'recipientId'>;

function withNotifications(state: AppData, items: NewNotification[], at: string): AppData {
  if (items.length === 0) return state;
  const created = items.map((item) => ({ ...item, id: newId('ntf'), createdAt: at, read: false }));
  return { ...state, notifications: [...created, ...state.notifications].slice(0, MAX_NOTIFICATIONS) };
}

const isLead = (state: AppData, id: string) => state.agents.find((a) => a.id === id)?.role === 'Support Lead';

function activityFor(ticketId: string, actorId: string | null, text: string, at: string): ActivityEvent {
  return { id: newId(`${ticketId}-ev`), ticketId, actorId, text, createdAt: at };
}

function changeEvents(ticket: Ticket, changes: TicketChanges, actorId: string, at: string, agentName: (id: string | null) => string): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  if (changes.status !== undefined && changes.status !== ticket.status) {
    const text = changes.status === 'resolved' ? 'Marked as resolved' : `Status changed to ${STATUS_LABELS[changes.status]}`;
    events.push(activityFor(ticket.id, actorId, text, at));
  }
  if (changes.priority !== undefined && changes.priority !== ticket.priority) {
    events.push(activityFor(ticket.id, actorId, `Priority changed to ${PRIORITY_LABELS[changes.priority]}`, at));
  }
  if (changes.assigneeId !== undefined && changes.assigneeId !== ticket.assigneeId) {
    events.push(activityFor(ticket.id, actorId, `Assigned to ${agentName(changes.assigneeId)}`, at));
  }
  return events;
}

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'tickets/update': {
      const { ticketIds, changes, actorId, at } = action;
      const agentName = (id: string | null) => state.agents.find((a) => a.id === id)?.name ?? 'Unassigned';
      const notices: NewNotification[] = [];
      const next: AppData = {
        ...state,
        tickets: state.tickets.map((ticket) => {
          if (!ticketIds.includes(ticket.id)) return ticket;
          const events = changeEvents(ticket, changes, actorId, at, agentName);
          if (events.length === 0) return ticket;
          const nextStatus = changes.status ?? ticket.status;
          const becameResolved = nextStatus === 'resolved' && ticket.status !== 'resolved';
          const reopened = nextStatus !== 'resolved' && ticket.status === 'resolved';
          const newAssignee = changes.assigneeId !== undefined && changes.assigneeId !== ticket.assigneeId ? changes.assigneeId : null;
          if (newAssignee && newAssignee !== actorId) {
            notices.push({ title: 'Ticket assigned to you', body: `${ticket.id} was assigned to you by ${agentName(actorId)}.`, ticketId: ticket.id, recipientId: newAssignee });
          }
          return {
            ...ticket,
            status: nextStatus,
            priority: changes.priority ?? ticket.priority,
            assigneeId: changes.assigneeId !== undefined ? changes.assigneeId : ticket.assigneeId,
            resolvedAt: becameResolved ? at : reopened ? null : ticket.resolvedAt,
            reopenedAt: reopened ? at : ticket.reopenedAt,
            csat: reopened ? null : ticket.csat,
            updatedAt: at,
            activity: [...ticket.activity, ...events],
          };
        }),
      };
      return withNotifications(next, notices, at);
    }

    case 'tickets/reply': {
      const body = action.body.trim();
      if (!body) return state;
      return {
        ...state,
        tickets: state.tickets.map((ticket) => {
          if (ticket.id !== action.ticketId || ticket.status === 'resolved') return ticket;
          const message: Message = {
            id: newId(`${ticket.id}-msg`),
            ticketId: ticket.id,
            author: 'agent',
            agentId: action.agentId,
            body,
            createdAt: action.at,
          };
          return {
            ...ticket,
            // After an agent replies, the next move belongs to the customer.
            status: 'waiting_customer',
            assigneeId: ticket.assigneeId ?? action.agentId,
            messages: [...ticket.messages, message],
            updatedAt: action.at,
          };
        }),
      };
    }

    case 'tickets/note': {
      const body = action.body.trim();
      if (!body) return state;
      return {
        ...state,
        tickets: state.tickets.map((ticket) => {
          if (ticket.id !== action.ticketId) return ticket;
          const note: InternalNote = {
            id: newId(`${ticket.id}-note`),
            ticketId: ticket.id,
            agentId: action.agentId,
            body,
            createdAt: action.at,
          };
          return { ...ticket, notes: [...ticket.notes, note], updatedAt: action.at };
        }),
      };
    }

    case 'tickets/customerReply': {
      const body = action.body.trim();
      const target = state.tickets.find((t) => t.id === action.ticketId);
      if (!body || !target || target.status === 'resolved') return state;
      const message: Message = { id: newId(`${target.id}-msg`), ticketId: target.id, author: 'customer', body, createdAt: action.at };
      const next: AppData = {
        ...state,
        tickets: state.tickets.map((ticket) =>
          ticket.id === target.id
            ? {
                ...ticket,
                // The customer answered, so the ball is back with support.
                status: ticket.status === 'waiting_customer' ? 'in_progress' : ticket.status,
                messages: [...ticket.messages, message],
                updatedAt: action.at,
              }
            : ticket,
        ),
      };
      if (!state.settings.notifyCustomerReply) return next;
      const customerName = customers.find((c) => c.id === target.customerId)?.name ?? 'The customer';
      return withNotifications(next, [{ title: 'Customer replied', body: `${customerName} replied on ${target.id}.`, ticketId: target.id, recipientId: target.assigneeId ?? undefined }], action.at);
    }

    case 'escalations/create': {
      const { escalation, actorId, at } = action;
      const title = escalation.title.trim();
      const description = escalation.description.trim();
      const ticket = state.tickets.find((t) => t.id === escalation.ticketId);
      const developer = state.agents.find((a) => a.id === escalation.assigneeId);
      if (!ticket || !title || !description) return state;
      if (escalation.assigneeId && developer?.role !== 'Developer') return state;
      const id = `ESC-${Math.max(200, ...state.escalations.map((e) => Number(e.id.slice(4)))) + 1}`;
      const text = `Escalated to developers (${id})${developer ? `, assigned to ${developer.name}` : ''}`;
      const next: AppData = {
        ...state,
        escalations: [
          { ...escalation, title, description, id, status: 'open', createdById: actorId, createdAt: at, updatedAt: at },
          ...state.escalations,
        ],
        tickets: state.tickets.map((t) =>
          t.id === ticket.id ? { ...t, updatedAt: at, activity: [...t.activity, activityFor(t.id, actorId, text, at)] } : t,
        ),
      };
      const notices: NewNotification[] =
        developer && developer.id !== actorId
          ? [{ title: 'Issue assigned to you', body: `${id} "${title}" was escalated from ${ticket.id}.`, ticketId: ticket.id, recipientId: developer.id }]
          : [];
      return withNotifications(next, notices, at);
    }

    case 'escalations/update': {
      const { escalationId, changes, actorId, at } = action;
      const current = state.escalations.find((e) => e.id === escalationId);
      if (!current) return state;
      if (changes.assigneeId && state.agents.find((a) => a.id === changes.assigneeId)?.role !== 'Developer') return state;
      const next: Escalation = {
        ...current,
        status: changes.status ?? current.status,
        assigneeId: changes.assigneeId !== undefined ? changes.assigneeId : current.assigneeId,
        updatedAt: at,
      };
      if (next.status === current.status && next.assigneeId === current.assigneeId) return state;
      const statusChanged = next.status !== current.status;
      const updated: AppData = {
        ...state,
        escalations: state.escalations.map((e) => (e.id === escalationId ? next : e)),
        // Support watches the ticket, so a change in developer status is recorded there.
        tickets: statusChanged
          ? state.tickets.map((t) =>
              t.id === current.ticketId
                ? { ...t, updatedAt: at, activity: [...t.activity, activityFor(t.id, actorId, `${current.id} is now ${ESCALATION_STATUS_LABELS[next.status]}`, at)] }
                : t,
            )
          : state.tickets,
      };
      const notices: NewNotification[] = [];
      if (statusChanged && next.status === 'fixed' && current.createdById !== actorId) {
        notices.push({ title: 'Issue fixed', body: `${current.id} for ${current.ticketId} is now fixed.`, ticketId: current.ticketId, recipientId: current.createdById });
      }
      if (next.assigneeId && next.assigneeId !== current.assigneeId && next.assigneeId !== actorId) {
        notices.push({ title: 'Issue assigned to you', body: `${current.id} "${current.title}" was assigned to you.`, ticketId: current.ticketId, recipientId: next.assigneeId });
      }
      return withNotifications(updated, notices, at);
    }

    case 'agents/availability':
      // Agents set their own status; leads can set anyone's.
      if (action.actorId !== action.agentId && !isLead(state, action.actorId)) return state;
      return {
        ...state,
        agents: state.agents.map((a) => (a.id === action.agentId ? { ...a, availability: action.availability } : a)),
      };

    case 'agents/add': {
      const name = action.agent.name.trim();
      const email = action.agent.email.trim().toLowerCase();
      if (!isLead(state, action.actorId) || !name || state.agents.some((a) => a.email.toLowerCase() === email)) return state;
      return {
        ...state,
        agents: [...state.agents, { ...action.agent, id: newId('agt'), name, email, availability: 'offline' }],
      };
    }

    case 'agents/remove': {
      // A lead cannot remove themselves, so the workspace always keeps at least one lead.
      if (!isLead(state, action.actorId) || action.agentId === action.actorId) return state;
      const name = state.agents.find((a) => a.id === action.agentId)?.name ?? 'agent';
      return {
        ...state,
        agents: state.agents.filter((a) => a.id !== action.agentId),
        escalations: state.escalations.map((e) =>
          e.assigneeId === action.agentId ? { ...e, assigneeId: null, status: e.status === 'fixed' ? 'fixed' : 'open', updatedAt: action.at } : e,
        ),
        // Their open tickets go back to the unassigned queue. Resolved tickets are unassigned too but keep their history untouched.
        tickets: state.tickets.map((ticket) => {
          if (ticket.assigneeId !== action.agentId) return ticket;
          if (ticket.status === 'resolved') return { ...ticket, assigneeId: null };
          return {
            ...ticket,
            assigneeId: null,
            updatedAt: action.at,
            activity: [...ticket.activity, activityFor(ticket.id, action.actorId, `Unassigned because ${name} was removed from the team`, action.at)],
          };
        }),
      };
    }

    case 'settings/update':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'notifications/read':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)),
      };

    case 'notifications/readAll':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };

    case 'data/reset':
      return buildSeed(new Date(action.at));
  }
}
