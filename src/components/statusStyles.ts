import type { TicketStatus } from '../types';

export const STATUS_STYLES: Record<TicketStatus, string> = {
  open: 'bg-sky-50 text-sky-700 ring-sky-200',
  in_progress: 'bg-accent-soft text-accent ring-accent/25',
  waiting_customer: 'bg-amber-50 text-amber-700 ring-amber-200',
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};
