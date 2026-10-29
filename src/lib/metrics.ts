import type { Agent, Escalation, Ticket } from '../types';
import { isDeveloper } from './escalation';
import {
  SLA_MINUTES,
  getFirstResponseMinutes,
  getResolutionMinutes,
  isActive,
  isAwaitingResponse,
  isOverdue,
} from './ticket';

// Every dashboard and analytics number comes from these functions so the definitions match everywhere.

function notNull<T>(value: T | null): value is T {
  return value !== null;
}

export function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export interface Overview {
  active: number;
  unassigned: number;
  awaitingResponse: number;
  overdue: number;
  avgFirstResponseMin: number | null;
  avgResolutionMin: number | null;
  csat: number | null;
  csatCount: number;
}

export function computeOverview(tickets: Ticket[], now: Date): Overview {
  const active = tickets.filter(isActive);
  const ratings = tickets.map((t) => t.csat).filter(notNull);
  return {
    active: active.length,
    unassigned: active.filter((t) => t.assigneeId === null).length,
    awaitingResponse: active.filter(isAwaitingResponse).length,
    overdue: active.filter((t) => isOverdue(t, now)).length,
    avgFirstResponseMin: average(tickets.map(getFirstResponseMinutes).filter(notNull)),
    avgResolutionMin: average(tickets.map(getResolutionMinutes).filter(notNull)),
    csat: average(ratings),
    csatCount: ratings.length,
  };
}

// Share of tickets whose first agent reply came within the priority's target. Null when nothing has been answered yet.
export function firstReplyWithinTarget(tickets: Ticket[]): { pct: number | null; count: number } {
  const answered = tickets.filter((t) => getFirstResponseMinutes(t) !== null);
  const onTime = answered.filter((t) => (getFirstResponseMinutes(t) as number) <= SLA_MINUTES[t.priority]);
  return { pct: answered.length ? (onTime.length / answered.length) * 100 : null, count: answered.length };
}

export interface DayPoint {
  label: string;
  created: number;
  resolved: number;
}

// Counts tickets created and resolved per local calendar day, oldest first.
export function dailyVolume(tickets: Ticket[], now: Date, days = 7): DayPoint[] {
  const points: DayPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - offset);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const inDay = (iso: string | null) => {
      if (!iso) return false;
      const time = new Date(iso).getTime();
      return time >= start.getTime() && time < end.getTime();
    };
    points.push({
      // Past a week the weekday repeats, so longer ranges are labelled with dates.
      label: start.toLocaleDateString('en-US', days > 7 ? { month: 'short', day: 'numeric' } : { weekday: 'short' }),
      created: tickets.filter((t) => inDay(t.createdAt)).length,
      resolved: tickets.filter((t) => inDay(t.resolvedAt)).length,
    });
  }
  return points;
}

export interface AgentStats {
  agent: Agent;
  active: number;
  resolved: number;
  avgFirstResponseMin: number | null;
}

export function agentStats(agents: Agent[], tickets: Ticket[], escalations: Escalation[] = []): AgentStats[] {
  return agents.map((agent) => {
    if (isDeveloper(agent)) {
      const theirs = escalations.filter((e) => e.assigneeId === agent.id);
      return {
        agent,
        active: theirs.filter((e) => e.status !== 'fixed').length,
        resolved: theirs.filter((e) => e.status === 'fixed').length,
        avgFirstResponseMin: null,
      };
    }
    const mine = tickets.filter((t) => t.assigneeId === agent.id);
    return {
      agent,
      active: mine.filter(isActive).length,
      resolved: mine.filter((t) => !isActive(t)).length,
      avgFirstResponseMin: average(mine.map(getFirstResponseMinutes).filter(notNull)),
    };
  });
}

export type Workload = 'light' | 'steady' | 'heavy';

// Thresholds for the current team size; tune them if the team grows.
export function workloadLevel(activeTickets: number): Workload {
  if (activeTickets >= 5) return 'heavy';
  if (activeTickets >= 3) return 'steady';
  return 'light';
}
