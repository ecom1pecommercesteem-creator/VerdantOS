import { useState } from 'react';
import { BarRow, StatCard, VolumeChart } from '../components/charts';
import { stagger } from '../components/motion';
import { PageHeader } from '../components/PageHeader';
import { Avatar, CARD_TITLE, SelectField } from '../components/ui';
import { formatDuration } from '../lib/format';
import { isDeveloper } from '../lib/escalation';
import { agentStats, average, computeOverview, dailyVolume, firstReplyWithinTarget } from '../lib/metrics';
import { CATEGORY_LABELS, PRIORITY_LABELS, PRIORITY_ORDER } from '../lib/ticket';
import { useNow } from '../lib/useNow';
import { useStore } from '../state/useStore';
import type { TicketCategory } from '../types';

const RANGE_OPTIONS = [7, 14] as const;
type RangeDays = (typeof RANGE_OPTIONS)[number];
const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as TicketCategory[];

export function AnalyticsPage() {
  const { data } = useStore();
  const now = useNow();
  const [rangeDays, setRangeDays] = useState<RangeDays>(7);

  // Cards, distributions and the agent table use tickets created inside the selected range. The volume chart
  // counts everything that happened on each day, including older tickets being resolved.
  const DAY = 86_400_000;
  const cutoff = now.getTime() - rangeDays * DAY;
  const scope = data.tickets.filter((t) => new Date(t.createdAt).getTime() >= cutoff);
  const previousScope = data.tickets.filter((t) => {
    const created = new Date(t.createdAt).getTime();
    return created < cutoff && created >= cutoff - rangeDays * DAY;
  });
  const overview = computeOverview(scope, now);
  const previous = computeOverview(previousScope, now);
  const replyTarget = firstReplyWithinTarget(scope);
  // "▲ 22m vs previous 7 days": for response and resolution times, up means slower.
  const versusPrevious = (current: number | null, before: number | null) => {
    if (current === null || before === null) return 'No earlier data to compare';
    const diff = Math.round(current - before);
    return diff === 0 ? `Same as previous ${rangeDays} days` : `${diff > 0 ? '▲' : '▼'} ${formatDuration(Math.abs(diff))} vs previous ${rangeDays} days`;
  };
  const volume = dailyVolume(data.tickets, now, rangeDays);
  const byPriority = PRIORITY_ORDER.map((p) => ({ key: p, value: scope.filter((t) => t.priority === p).length }));
  const byCategory = CATEGORY_KEYS.map((c) => ({ key: c, value: scope.filter((t) => t.category === c).length }));
  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => ({ stars, value: scope.filter((t) => t.csat === stars).length }));
  const ratedCount = ratingCounts.reduce((sum, row) => sum + row.value, 0);
  const agents = agentStats(data.agents.filter((a) => !isDeveloper(a)), scope).map((row) => {
    const ratings = scope.filter((t) => t.assigneeId === row.agent.id && t.csat !== null).map((t) => t.csat as number);
    return { ...row, csat: average(ratings), ratings: ratings.length };
  });
  const maxPriority = Math.max(1, ...byPriority.map((r) => r.value));
  const maxCategory = Math.max(1, ...byCategory.map((r) => r.value));
  const maxRating = Math.max(1, ...ratingCounts.map((r) => r.value));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader
        title="Analytics"
        subtitle="Calculated from your ticket data"
        actions={
          <SelectField label="Date range" value={String(rangeDays)} onChange={(e) => setRangeDays(Number(e.target.value) as RangeDays)}>
            {RANGE_OPTIONS.map((days) => (
              <option key={days} value={days}>Last {days} days</option>
            ))}
          </SelectField>
        }
      />

      <div className="flex flex-col gap-5 pb-6">
        <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard index={0} label="Tickets created" value={String(scope.length)} detail={`Last ${rangeDays} days`} />
          <StatCard index={1} label="Still active" value={String(overview.active)} detail={`${scope.length - overview.active} of these are resolved`} />
          <StatCard
            index={2}
            label="Replied within target"
            value={replyTarget.pct === null ? '—' : `${Math.round(replyTarget.pct)}%`}
            detail={`${replyTarget.count} answered tickets, by priority target`}
          />
          <StatCard index={3} label="Avg first response" value={formatDuration(overview.avgFirstResponseMin)} detail={versusPrevious(overview.avgFirstResponseMin, previous.avgFirstResponseMin)} />
          <StatCard index={4} label="Avg resolution time" value={formatDuration(overview.avgResolutionMin)} detail={versusPrevious(overview.avgResolutionMin, previous.avgResolutionMin)} />
          <StatCard
            index={5}
            label="Customer satisfaction"
            value={overview.csat === null ? '—' : `${overview.csat.toFixed(1)} / 5`}
            detail={overview.csat === null ? 'No ratings in range' : `${overview.csatCount} ratings`}
          />
        </section>

        <section style={stagger(6)} className="enter rounded-3xl bg-panel p-6" aria-labelledby="trend-title">
          <h2 id="trend-title" className={CARD_TITLE}>Tickets created vs resolved</h2>
          <p className="mt-1 text-xs text-muted">Everything that happened each calendar day, including older tickets being resolved.</p>
          <div className="mt-4">
            <VolumeChart points={volume} />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="enter rounded-3xl bg-panel p-6" aria-labelledby="priority-dist-title">
            <h2 id="priority-dist-title" className={CARD_TITLE}>Tickets by priority</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {byPriority.map((row) => (
                <BarRow key={row.key} label={PRIORITY_LABELS[row.key]} value={row.value} max={maxPriority} />
              ))}
            </ul>
          </section>
          <section className="enter rounded-3xl bg-panel p-6" aria-labelledby="category-dist-title">
            <h2 id="category-dist-title" className={CARD_TITLE}>Tickets by category</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {byCategory.map((row) => (
                <BarRow key={row.key} label={CATEGORY_LABELS[row.key]} value={row.value} max={maxCategory} />
              ))}
            </ul>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="enter rounded-3xl bg-panel p-6" aria-labelledby="csat-title">
            <h2 id="csat-title" className={CARD_TITLE}>Customer ratings</h2>
            <p className="mt-1 text-xs text-muted">{ratedCount} rated tickets in range</p>
            <ul className="mt-4 flex flex-col gap-3">
              {ratingCounts.map((row) => (
                <BarRow key={row.stars} label={`${row.stars} star${row.stars === 1 ? '' : 's'}`} value={row.value} max={maxRating} tone="bg-amber-400" />
              ))}
            </ul>
          </section>

          <section className="rounded-3xl bg-panel p-5 lg:col-span-2" aria-labelledby="agents-title">
            <h2 id="agents-title" className={CARD_TITLE}>Agent performance</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr>
                    <th scope="col" className="pb-3 font-medium">Agent</th>
                    <th scope="col" className="pb-3 text-right font-medium">Assigned</th>
                    <th scope="col" className="pb-3 text-right font-medium">Resolved</th>
                    <th scope="col" className="pb-3 text-right font-medium">Avg first response</th>
                    <th scope="col" className="pb-3 text-right font-medium">CSAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {agents.map((row) => (
                    <tr key={row.agent.id}>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={row.agent.name} size="sm" />
                          <span className="font-medium">{row.agent.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right tabular-nums">{row.active + row.resolved}</td>
                      <td className="py-3 text-right tabular-nums">{row.resolved}</td>
                      <td className="py-3 text-right tabular-nums">{formatDuration(row.avgFirstResponseMin)}</td>
                      <td className="py-3 text-right tabular-nums">{row.csat === null ? '—' : `${row.csat.toFixed(1)} (${row.ratings})`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
