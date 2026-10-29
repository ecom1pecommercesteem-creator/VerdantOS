import { ListFilter, Search, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { customers } from '../data/seed';
import { formatDuration, formatRelative } from '../lib/format';
import { CATEGORY_LABELS, PRIORITY_LABELS, minutesUntilDue } from '../lib/ticket';
import type { TicketFilters, TicketView } from '../lib/filterTickets';
import type { Agent, Ticket, TicketCategory, TicketPriority, TicketStatus } from '../types';
import { Avatar, Button, FilterTabs, PriorityLabel, SelectField, StatusBadge } from './ui';

const QUICK_VIEWS: { value: Exclude<TicketView, 'all'>; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'awaiting', label: 'Awaiting reply' },
  { value: 'overdue', label: 'Overdue' },
];

const STATUS_TABS: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_customer', label: 'Waiting' },
  { value: 'resolved', label: 'Resolved' },
];

interface TicketListPaneProps {
  tickets: Ticket[];
  visibleCount: number;
  totalCount: number;
  statusCounts: Record<TicketStatus | 'all', number>;
  viewCounts: Record<Exclude<TicketView, 'all'>, number>;
  drafts: Record<string, string>; // unsent replies by ticket id
  filters: TicketFilters;
  agents: Agent[];
  selectedId?: string;
  now: Date;
  filterOpen: boolean;
  onToggleFilter: () => void;
  onChange: (next: Partial<TicketFilters>) => void;
  onReset: () => void;
}

function hasActiveFilters(filters: TicketFilters): boolean {
  return (
    filters.query !== '' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.assignee !== 'all' ||
    filters.category !== 'all' ||
    filters.view !== 'all'
  );
}

export function TicketListPane({
  tickets,
  visibleCount,
  totalCount,
  statusCounts,
  viewCounts,
  drafts,
  filters,
  agents,
  selectedId,
  now,
  filterOpen,
  onToggleFilter,
  onChange,
  onReset,
}: TicketListPaneProps) {
  const location = useLocation();
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? 'Unknown customer';
  const filtersActive = filters.priority !== 'all' || filters.assignee !== 'all' || filters.category !== 'all';

  return (
    <section className="flex min-h-0 w-full flex-col border-line lg:w-[420px] lg:shrink-0 lg:border-r">
      <div className="flex items-center justify-between px-5 pt-5">
        <h2 className="text-lg font-semibold">Inbox</h2>
        <button
          type="button"
          onClick={onToggleFilter}
          aria-expanded={filterOpen}
          aria-controls="ticket-filter-panel"
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
            filterOpen || filtersActive ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-panel text-ink hover:bg-canvas'
          }`}
        >
          <ListFilter className="size-4" aria-hidden="true" />
          Filter
        </button>
      </div>

      {filterOpen && (
        <div id="ticket-filter-panel" className="mx-5 mt-4 grid grid-cols-1 gap-2 rounded-2xl border border-line bg-canvas p-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <SelectField label="Filter by priority" value={filters.priority} onChange={(e) => onChange({ priority: e.target.value as TicketPriority | 'all' })}>
            <option value="all">All priorities</option>
            {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </SelectField>
          <SelectField label="Filter by agent" value={filters.assignee} onChange={(e) => onChange({ assignee: e.target.value })}>
            <option value="all">All agents</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </SelectField>
          <SelectField label="Filter by category" value={filters.category} onChange={(e) => onChange({ category: e.target.value as TicketCategory | 'all' })}>
            <option value="all">All categories</option>
            {(Object.keys(CATEGORY_LABELS) as TicketCategory[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </SelectField>
        </div>
      )}

      <div role="group" aria-label="Quick views" className="flex flex-wrap gap-2 px-5 pt-4">
        {QUICK_VIEWS.map((view) => {
          const selected = filters.view === view.value;
          return (
            <button
              key={view.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange({ view: selected ? 'all' : view.value })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                selected ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-panel text-body hover:bg-canvas'
              }`}
            >
              {view.label} <span className="tabular-nums">{viewCounts[view.value]}</span>
            </button>
          );
        })}
      </div>

      <FilterTabs
        label="Filter by status"
        value={filters.status}
        onChange={(status) => onChange({ status })}
        options={STATUS_TABS.map((tab) => ({ ...tab, count: statusCounts[tab.value] }))}
      />

      <div className="px-5 pt-4 pb-3">
        <label className="flex items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 focus-within:ring-2 focus-within:ring-accent">
          <Search className="size-4 text-subtle" aria-hidden="true" />
          <span className="sr-only">Search by ticket ID, order, subject or customer</span>
          <input
            type="search"
            name="ticket-search"
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
            placeholder="Ticket ID, order, subject or customer"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
          />
          {filters.query && (
            <button type="button" onClick={() => onChange({ query: '' })} aria-label="Clear search" className="text-subtle hover:text-ink">
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </label>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>
            Showing {visibleCount} of {totalCount} tickets
          </span>
          {hasActiveFilters(filters) && (
            <button type="button" onClick={onReset} className="font-medium text-accent hover:underline">
              Reset filters
            </button>
          )}
        </div>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto" aria-label="Tickets">
        {tickets.map((ticket) => {
          const selected = ticket.id === selectedId;
          const last = ticket.messages[ticket.messages.length - 1];
          const minutesLeft = minutesUntilDue(ticket, now);
          const overdue = minutesLeft !== null && minutesLeft < 0;
          const dueSoon = minutesLeft !== null && minutesLeft >= 0 && minutesLeft <= 60;
          const assignee = agents.find((a) => a.id === ticket.assigneeId);
          return (
            <li key={ticket.id} className="border-b border-line">
              <Link
                to={{ pathname: `/tickets/${ticket.id}`, search: location.search }}
                aria-current={selected ? 'true' : undefined}
                className={`block px-5 py-4 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                  selected ? 'bg-accent-soft/60' : 'hover:bg-canvas/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={customerName(ticket.customerId)} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm text-body">{customerName(ticket.customerId)}</span>
                  <span className={`shrink-0 text-xs ${overdue ? 'font-medium text-red-600' : dueSoon ? 'font-medium text-amber-700' : 'text-muted'}`}>
                    {overdue ? 'Overdue' : dueSoon ? `Due in ${formatDuration(minutesLeft)}` : formatRelative(ticket.updatedAt, now)}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink">
                  <span className="min-w-0 truncate">{ticket.subject}</span>
                </p>
                <p className="mt-1 truncate text-sm text-muted">{last?.body ?? 'No messages yet'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <PriorityLabel priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                  {assignee ? (
                    <span className="text-xs text-muted">{assignee.name.split(' ')[0]}</span>
                  ) : ticket.status !== 'resolved' ? (
                    <span className="rounded-md bg-accent px-1.5 py-0.5 text-xs font-medium text-white">Unassigned</span>
                  ) : null}
                  {drafts[ticket.id] && <span className="text-xs font-medium text-accent">Draft</span>}
                </div>
              </Link>
            </li>
          );
        })}
        {tickets.length === 0 && (
          <li className="flex flex-col items-start gap-3 px-5 py-10">
            <p className="text-sm font-semibold">No tickets match these filters.</p>
            <p className="text-sm text-muted">Try a different status, or clear the filters to see everything.</p>
            <Button onClick={onReset}>Reset filters</Button>
          </li>
        )}
      </ul>
    </section>
  );
}
