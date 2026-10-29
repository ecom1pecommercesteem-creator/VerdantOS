import { useState } from 'react';
import { Link } from 'react-router-dom';
import { stagger } from '../components/motion';
import { PageHeader } from '../components/PageHeader';
import { STATUS_STYLES } from '../components/statusStyles';
import { Avatar, Badge, FilterTabs, PriorityLabel, SelectField } from '../components/ui';
import { customers } from '../data/seed';
import { ESCALATION_STATUS_LABELS, ESCALATION_STATUS_ORDER, isDeveloper } from '../lib/escalation';
import { formatRelative } from '../lib/format';
import { PRIORITY_ORDER } from '../lib/ticket';
import { useNow } from '../lib/useNow';
import { useStore } from '../state/useStore';
import type { Escalation, EscalationStatus } from '../types';

type StatusFilter = EscalationStatus | 'all';

// Escalations reuse the ticket badge colours: open, in progress and fixed read the same way as open, in progress and resolved.
const ESCALATION_STYLES: Record<EscalationStatus, string> = {
  open: STATUS_STYLES.open,
  in_progress: STATUS_STYLES.in_progress,
  fixed: STATUS_STYLES.resolved,
};

// Unfixed work first, then most severe, then oldest, so the top of the list is what to pick up next.
function byPickupOrder(a: Escalation, b: Escalation): number {
  const fixed = Number(a.status === 'fixed') - Number(b.status === 'fixed');
  if (fixed) return fixed;
  const severity = PRIORITY_ORDER.indexOf(a.severity) - PRIORITY_ORDER.indexOf(b.severity);
  return severity || a.createdAt.localeCompare(b.createdAt);
}

export function DevelopersPage() {
  const { data, currentAgent, actions } = useStore();
  const now = useNow();
  const [filter, setFilter] = useState<StatusFilter>('all');
  // A developer's own queue; support agents see everything.
  const [mineOnly, setMineOnly] = useState(false);
  const canFilterMine = currentAgent !== null && isDeveloper(currentAgent);
  const developers = data.agents.filter(isDeveloper);
  const inScope = data.escalations.filter((e) => !mineOnly || e.assigneeId === currentAgent?.id);
  const countOf = (status: StatusFilter) => inScope.filter((e) => status === 'all' || e.status === status).length;
  const visible = inScope.filter((e) => filter === 'all' || e.status === filter).sort(byPickupOrder);
  const tabs: StatusFilter[] = ['all', ...ESCALATION_STATUS_ORDER];
  const nameOf = (id: string | null) => data.agents.find((a) => a.id === id)?.name ?? 'a former team member';

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader
        title="Developers"
        subtitle={`${countOf('open')} open · ${countOf('in_progress')} in progress · ${countOf('fixed')} fixed`}
      />

      <div className="flex flex-col gap-5 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <FilterTabs
            variant="pill"
            label="Filter by status"
            value={filter}
            onChange={setFilter}
            options={tabs.map((tab) => ({ value: tab, label: tab === 'all' ? 'All issues' : ESCALATION_STATUS_LABELS[tab], count: countOf(tab) }))}
          />
          {canFilterMine && (
            <button
              type="button"
              aria-pressed={mineOnly}
              onClick={() => setMineOnly((value) => !value)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                mineOnly ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-panel text-ink hover:bg-canvas'
              }`}
            >
              Assigned to me
            </button>
          )}
        </div>

        {visible.length === 0 ? (
          <p className="rounded-3xl bg-panel px-5 py-8 text-center text-sm text-muted">
            {data.escalations.length === 0
              ? 'No issues have been sent to the developers yet. Support can escalate a ticket from its detail page.'
              : mineOnly && inScope.length === 0
                ? 'Nothing is assigned to you right now.'
              : 'No issues match this filter.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((item, index) => {
              const ticket = data.tickets.find((t) => t.id === item.ticketId);
              const customer = customers.find((c) => c.id === ticket?.customerId);
              return (
                <li key={item.id} style={stagger(Math.min(index, 6))} className="enter rounded-3xl bg-panel p-6">
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                    <div className="min-w-0 flex-1 basis-80">
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        <span className="font-medium text-body">{item.id}</span>
                        <PriorityLabel priority={item.severity} />
                        <Badge className={ESCALATION_STYLES[item.status]}>{ESCALATION_STATUS_LABELS[item.status]}</Badge>
                      </p>
                      <h2 className="mt-2 text-base font-semibold">{item.title}</h2>
                      <p className="mt-1.5 text-sm whitespace-pre-line text-body">{item.description}</p>
                      <p className="mt-3 text-xs text-muted">
                        From{' '}
                        <Link to={`/tickets/${item.ticketId}`} className="font-medium text-accent hover:underline">
                          {item.ticketId}
                        </Link>
                        {customer && <> · {customer.name}</>} · Reported by {nameOf(item.createdById)} {formatRelative(item.createdAt, now)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.assigneeId && <Avatar name={nameOf(item.assigneeId)} size="sm" />}
                      <SelectField
                        label={`Developer for ${item.id}`}
                        value={item.assigneeId ?? ''}
                        onChange={(e) => actions.updateEscalation(item.id, { assigneeId: e.target.value || null })}
                      >
                        <option value="">Unassigned</option>
                        {developers.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </SelectField>
                      <SelectField
                        label={`Status of ${item.id}`}
                        value={item.status}
                        onChange={(e) => actions.updateEscalation(item.id, { status: e.target.value as EscalationStatus })}
                      >
                        {ESCALATION_STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>{ESCALATION_STATUS_LABELS[s]}</option>
                        ))}
                      </SelectField>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
