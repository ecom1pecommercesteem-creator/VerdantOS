import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { TicketDetail } from '../components/TicketDetail';
import { TicketListPane } from '../components/TicketListPane';
import { filterTickets, type TicketFilters, type TicketView } from '../lib/filterTickets';
import { isDeveloper } from '../lib/escalation';
import { agentStats } from '../lib/metrics';
import { useNow } from '../lib/useNow';
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '../lib/ticket';
import { useStore } from '../state/useStore';
import type { TicketCategory, TicketPriority, TicketStatus } from '../types';

const STATUS_VALUES = Object.keys(STATUS_LABELS) as TicketStatus[];
const PRIORITY_VALUES = Object.keys(PRIORITY_LABELS) as TicketPriority[];
const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as TicketCategory[];
const VIEW_VALUES: TicketView[] = ['active', 'unassigned', 'awaiting', 'overdue'];

function readFilters(params: URLSearchParams): TicketFilters {
  const pick = <T extends string>(value: string | null, allowed: T[]): T | 'all' =>
    value && (allowed as string[]).includes(value) ? (value as T) : 'all';
  return {
    query: params.get('q') ?? '',
    status: pick(params.get('status'), STATUS_VALUES),
    priority: pick(params.get('priority'), PRIORITY_VALUES),
    assignee: params.get('assignee') ?? 'all',
    category: pick(params.get('category'), CATEGORY_VALUES),
    view: pick(params.get('view'), VIEW_VALUES),
  };
}

export function TicketsPage() {
  const { ticketId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, actions } = useStore();
  const [filterOpen, setFilterOpen] = useState(false);
  // Unsent replies by ticket id, so opening another ticket does not throw a half-written reply away.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const now = useNow();
  const filters = readFilters(searchParams);

  // Filters live in the URL so a filtered view can be reloaded or shared.
  function updateFilters(next: Partial<TicketFilters>) {
    const merged = { ...filters, ...next };
    const params = new URLSearchParams();
    if (merged.query) params.set('q', merged.query);
    if (merged.status !== 'all') params.set('status', merged.status);
    if (merged.priority !== 'all') params.set('priority', merged.priority);
    if (merged.assignee !== 'all') params.set('assignee', merged.assignee);
    if (merged.category !== 'all') params.set('category', merged.category);
    if (merged.view !== 'all') params.set('view', merged.view);
    setSearchParams(params, { replace: true });
  }

  const visible = filterTickets(data.tickets, filters, now);
  // Status tab counts respect every other filter so the numbers match what the list would show.
  const countsBase = filterTickets(data.tickets, { ...filters, status: 'all' }, now);
  const statusCounts = {
    all: countsBase.length,
    open: countsBase.filter((t) => t.status === 'open').length,
    in_progress: countsBase.filter((t) => t.status === 'in_progress').length,
    waiting_customer: countsBase.filter((t) => t.status === 'waiting_customer').length,
    resolved: countsBase.filter((t) => t.status === 'resolved').length,
  };
  const viewCount = (view: Exclude<TicketView, 'all'>) => filterTickets(data.tickets, { ...filters, view }, now).length;
  const viewCounts = { active: viewCount('active'), unassigned: viewCount('unassigned'), awaiting: viewCount('awaiting'), overdue: viewCount('overdue') };
  const supportAgents = data.agents.filter((a) => !isDeveloper(a));
  const workload = Object.fromEntries(agentStats(supportAgents, data.tickets).map((row) => [row.agent.id, row.active]));
  const selected = ticketId ? data.tickets.find((t) => t.id === ticketId) : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* On a phone the open ticket takes the whole screen, so the page header makes way for it. */}
      <div className={ticketId ? 'hidden lg:block' : undefined}>
        <PageHeader
          title="Tickets"
          subtitle={`${data.tickets.filter((t) => t.status !== 'resolved').length} active · ${data.tickets.filter((t) => t.status === 'resolved').length} resolved`}
        />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-3xl bg-panel">
        <div className={`${ticketId ? 'hidden lg:flex' : 'flex'} min-h-0 min-w-0 flex-1 lg:flex-none`}>
          <TicketListPane
            tickets={visible}
            visibleCount={visible.length}
            totalCount={data.tickets.length}
            statusCounts={statusCounts}
            viewCounts={viewCounts}
            drafts={drafts}
            filters={filters}
            agents={supportAgents}
            selectedId={ticketId}
            now={now}
            filterOpen={filterOpen}
            onToggleFilter={() => setFilterOpen((open) => !open)}
            onChange={updateFilters}
            onReset={() => updateFilters({ query: '', status: 'all', priority: 'all', assignee: 'all', category: 'all', view: 'all' })}
          />
        </div>

        <div className={`${ticketId ? 'flex' : 'hidden lg:flex'} min-h-0 min-w-0 flex-1 flex-col border-line lg:border-l`}>
          {selected ? (
            <TicketDetail
              key={selected.id}
              ticket={selected}
              agents={data.agents}
              escalations={data.escalations.filter((e) => e.ticketId === selected.id)}
              actions={actions}
              now={now}
              timeZone={data.settings.timezone}
              draft={drafts[selected.id] ?? ''}
              onDraftChange={(draft) => setDrafts((current) => ({ ...current, [selected.id]: draft }))}
              workload={workload}
              otherActive={data.tickets.filter((t) => t.customerId === selected.customerId && t.id !== selected.id && t.status !== 'resolved').length}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <p className="text-sm font-semibold">{ticketId ? 'Ticket not found' : 'Select a ticket'}</p>
              <p className="text-sm text-muted">
                {ticketId ? 'It may have been removed from this workspace.' : 'Choose a conversation from the inbox to read and reply.'}
              </p>
              {ticketId && (
                <Link to="/tickets" className="mt-2 text-sm font-medium text-accent hover:underline">
                  Back to all tickets
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
