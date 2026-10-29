import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from '../types';
import { customers } from '../data/seed';
import { isActive, isAwaitingResponse, isOverdue } from './ticket';

// Quick views for the questions an agent or lead asks first: what is waiting, what is unowned, what is late.
export type TicketView = 'all' | 'active' | 'unassigned' | 'awaiting' | 'overdue';

export interface TicketFilters {
  query: string;
  status: TicketStatus | 'all';
  priority: TicketPriority | 'all';
  assignee: string | 'all' | 'unassigned';
  category: TicketCategory | 'all';
  view: TicketView;
}

export const DEFAULT_FILTERS: TicketFilters = {
  query: '',
  status: 'all',
  priority: 'all',
  assignee: 'all',
  category: 'all',
  view: 'all',
};

function inView(ticket: Ticket, view: TicketView, now: Date): boolean {
  switch (view) {
    case 'active':
      return isActive(ticket);
    case 'unassigned':
      return isActive(ticket) && ticket.assigneeId === null;
    case 'awaiting':
      return isAwaitingResponse(ticket);
    case 'overdue':
      return isOverdue(ticket, now);
    default:
      return true;
  }
}

export function filterTickets(tickets: Ticket[], filters: TicketFilters, now: Date = new Date()): Ticket[] {
  const query = filters.query.trim().toLowerCase();
  return tickets
    .filter((ticket) => {
      if (filters.status !== 'all' && ticket.status !== filters.status) return false;
      if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false;
      if (filters.category !== 'all' && ticket.category !== filters.category) return false;
      if (filters.assignee === 'unassigned' && ticket.assigneeId !== null) return false;
      if (filters.assignee !== 'all' && filters.assignee !== 'unassigned' && ticket.assigneeId !== filters.assignee) return false;
      if (!inView(ticket, filters.view, now)) return false;
      if (query) {
        const customer = customers.find((c) => c.id === ticket.customerId);
        const haystack = `${ticket.id} ${ticket.orderId ?? ''} ${ticket.subject} ${customer?.name ?? ''} ${customer?.email ?? ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
