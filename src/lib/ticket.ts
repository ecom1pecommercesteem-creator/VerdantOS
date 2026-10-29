import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from '../types';

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_customer: 'Waiting for Customer',
  resolved: 'Resolved',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  order_shipping: 'Order & Shipping',
  returns_refunds: 'Returns & Refunds',
  payments: 'Payments',
  product_questions: 'Product Questions',
  account: 'Account Issues',
  other: 'Other',
};

export const STATUS_ORDER: TicketStatus[] = ['open', 'in_progress', 'waiting_customer', 'resolved'];
export const PRIORITY_ORDER: TicketPriority[] = ['urgent', 'high', 'medium', 'low'];

// Target time to reply to a customer message, in minutes.
export const SLA_MINUTES: Record<TicketPriority, number> = {
  urgent: 60,
  high: 4 * 60,
  medium: 8 * 60,
  low: 24 * 60,
};

const MINUTE = 60_000;

export function isActive(ticket: Ticket): boolean {
  return ticket.status !== 'resolved';
}

// A ticket is awaiting a response when the customer wrote last on an active ticket.
export function isAwaitingResponse(ticket: Ticket): boolean {
  if (!isActive(ticket)) return false;
  const last = ticket.messages[ticket.messages.length - 1];
  return last?.author === 'customer';
}

export function getLastCustomerMessageAt(ticket: Ticket): string | null {
  const customerMessages = ticket.messages.filter((m) => m.author === 'customer');
  return customerMessages.length ? customerMessages[customerMessages.length - 1].createdAt : null;
}

// The deadline for replying to the customer's latest message, or null if no reply is owed.
export function getResponseDueAt(ticket: Ticket): Date | null {
  if (!isAwaitingResponse(ticket)) return null;
  const lastCustomer = getLastCustomerMessageAt(ticket);
  if (!lastCustomer) return null;
  // A reopened ticket gets a fresh deadline instead of inheriting its old closing message's.
  const anchor = Math.max(new Date(lastCustomer).getTime(), ticket.reopenedAt ? new Date(ticket.reopenedAt).getTime() : 0);
  return new Date(anchor + SLA_MINUTES[ticket.priority] * MINUTE);
}

export function isOverdue(ticket: Ticket, now: Date): boolean {
  const due = getResponseDueAt(ticket);
  return due !== null && now.getTime() > due.getTime();
}

// Whole minutes left to reply (negative once overdue), or null if no reply is owed.
export function minutesUntilDue(ticket: Ticket, now: Date): number | null {
  const due = getResponseDueAt(ticket);
  return due === null ? null : Math.ceil((due.getTime() - now.getTime()) / MINUTE);
}

export function getFirstResponseMinutes(ticket: Ticket): number | null {
  const firstAgent = ticket.messages.find((m) => m.author === 'agent');
  if (!firstAgent) return null;
  return (new Date(firstAgent.createdAt).getTime() - new Date(ticket.createdAt).getTime()) / MINUTE;
}

export function getResolutionMinutes(ticket: Ticket): number | null {
  if (!ticket.resolvedAt) return null;
  return (new Date(ticket.resolvedAt).getTime() - new Date(ticket.createdAt).getTime()) / MINUTE;
}
