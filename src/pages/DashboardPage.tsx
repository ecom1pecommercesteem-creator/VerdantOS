import { Clock, Smile, Ticket, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarRow, StatCard, VolumeChart } from '../components/charts';
import { PageHeader } from '../components/PageHeader';
import { stagger } from '../components/motion';
import { Avatar, CARD, CARD_TITLE } from '../components/ui';
import { customers } from '../data/seed';
import { formatDuration, formatRelative } from '../lib/format';
import { agentStats, computeOverview, dailyVolume, workloadLevel } from '../lib/metrics';
import { PRIORITY_LABELS, PRIORITY_ORDER, STATUS_LABELS, STATUS_ORDER } from '../lib/ticket';
import { useNow } from '../lib/useNow';
import { isDeveloper } from '../lib/escalation';
import { useStore } from '../state/useStore';

const WORKLOAD_TEXT = { light: 'Light', steady: 'Steady', heavy: 'Heavy' } as const;

export function DashboardPage() {
  const { data, currentAgent } = useStore();
  const now = useNow();
  const { tickets, agents, settings } = data;
  const overview = computeOverview(tickets, now);
  const volume = dailyVolume(tickets, now);
  const workload = agentStats(agents.filter((a) => !isDeveloper(a)), tickets);
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? 'Unknown customer';

  const recentActivity = tickets
    .flatMap((t) => t.activity.filter((event) => !event.text.startsWith('Ticket created')).map((event) => ({ event, ticket: t })))
    .sort((a, b) => b.event.createdAt.localeCompare(a.event.createdAt))
    .slice(0, 6);
  const recentRequests = [...tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  const statusCounts = STATUS_ORDER.map((s) => ({ status: s, value: tickets.filter((t) => t.status === s).length }));
  const priorityCounts = PRIORITY_ORDER.map((p) => ({ priority: p, value: tickets.filter((t) => t.priority === p).length }));
  const maxStatus = Math.max(...statusCounts.map((s) => s.value));
  const maxPriority = Math.max(...priorityCounts.map((p) => p.value));
  const firstName = currentAgent?.name.split(' ')[0] ?? '';

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader title={`Hello, ${firstName}!`} subtitle={`Here is what is happening at ${settings.workspaceName} today.`} />

      <div className="grid grid-cols-1 gap-5 pb-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Ticket} index={0} label="Active tickets" value={String(overview.active)} to="/tickets?view=active" detail={`${overview.unassigned} unassigned`} detailTo="/tickets?view=unassigned" />
        <StatCard icon={Clock} index={1} label="Awaiting response" value={String(overview.awaitingResponse)} to="/tickets?view=awaiting" detail={`${overview.overdue} past SLA`} detailTo="/tickets?view=overdue" />
        <StatCard icon={Timer} index={2} label="Avg first response" value={formatDuration(overview.avgFirstResponseMin)} detail="Creation to first agent reply" />
        <StatCard
          tone="hero"
          icon={Smile}
          index={3} label="Customer satisfaction"
          value={overview.csat === null ? '—' : `${overview.csat.toFixed(1)} / 5`}
          detail={`${overview.csatCount} ratings · resolution ${formatDuration(overview.avgResolutionMin)}`}
        />

        <section className={`${CARD} sm:col-span-2`} style={stagger(4)} aria-labelledby="volume-title">
          <h2 id="volume-title" className={CARD_TITLE}>Ticket volume, last 7 days</h2>
          <div className="mt-4">
            <VolumeChart points={volume} />
          </div>
        </section>

        <section className={CARD} style={stagger(5)} aria-labelledby="status-title">
          <h2 id="status-title" className={CARD_TITLE}>By status</h2>
          <ul className="mt-5 flex flex-col gap-4">
            {statusCounts.map((row) => (
              <BarRow key={row.status} label={STATUS_LABELS[row.status]} value={row.value} max={maxStatus} />
            ))}
          </ul>
        </section>

        <section className={CARD} style={stagger(6)} aria-labelledby="priority-title">
          <h2 id="priority-title" className={CARD_TITLE}>By priority</h2>
          <ul className="mt-5 flex flex-col gap-4">
            {priorityCounts.map((row) => (
              <BarRow
                key={row.priority}
                label={PRIORITY_LABELS[row.priority]}
                value={row.value}
                max={maxPriority}
                tone={row.priority === 'urgent' ? 'bg-red-500' : row.priority === 'high' ? 'bg-orange-500' : 'bg-accent'}
              />
            ))}
          </ul>
        </section>

        <section className={CARD} style={stagger(7)} aria-labelledby="workload-title">
          <h2 id="workload-title" className={CARD_TITLE}>Agent workload</h2>
          <ul className="mt-5 flex flex-col gap-4">
            {workload.map(({ agent, active, resolved }) => {
              const level = workloadLevel(active);
              return (
                <li key={agent.id} className="flex items-center gap-3">
                  <Avatar name={agent.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">{agent.name}</span>
                      <span className="shrink-0 text-xs text-muted tabular-nums">{WORKLOAD_TEXT[level]}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
                      <div
                        className={`grow-x h-full rounded-full ${level === 'heavy' ? 'bg-red-500' : level === 'steady' ? 'bg-amber-400' : 'bg-accent'}`}
                        style={{ width: `${Math.min(100, active * 20)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted tabular-nums">{active} active · {resolved} resolved</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <Link to="/team" className="mt-5 inline-block text-sm font-medium text-accent hover:underline">
            Manage team
          </Link>
        </section>

        <section className={CARD} style={stagger(8)} aria-labelledby="activity-title">
          <h2 id="activity-title" className={CARD_TITLE}>Recent activity</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {recentActivity.map(({ event, ticket }) => (
              <li key={event.id} className="border-l-4 border-accent/70 pl-3 text-sm">
                <Link to={`/tickets/${ticket.id}`} className="font-medium hover:text-accent">
                  {ticket.id}
                </Link>
                <span className="text-body"> · {event.text}</span>
                <p className="mt-0.5 text-xs text-muted">{formatRelative(event.createdAt, now)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${CARD} sm:col-span-2`} style={stagger(9)} aria-labelledby="requests-title">
          <h2 id="requests-title" className={CARD_TITLE}>Recent customer requests</h2>
          <ul className="mt-4 divide-y divide-line">
            {recentRequests.map((ticket) => (
              <li key={ticket.id} className="flex items-center gap-3 py-3">
                <Avatar name={customerName(ticket.customerId)} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link to={`/tickets/${ticket.id}`} className="block truncate text-sm font-medium hover:text-accent">
                    {ticket.subject}
                  </Link>
                  <p className="truncate text-xs text-muted">
                    {customerName(ticket.customerId)} · {formatRelative(ticket.createdAt, now)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
