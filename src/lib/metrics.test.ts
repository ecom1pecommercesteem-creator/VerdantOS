import { describe, expect, it } from 'vitest';
import { buildSeed } from '../data/seed';
import { computeOverview, dailyVolume, firstReplyWithinTarget } from './metrics';

const NOW = new Date('2026-10-27T12:00:00Z');
const { tickets } = buildSeed(NOW);

describe('metrics', () => {
  it('counts active tickets, unassigned and past-deadline ones from the same rules the inbox uses', () => {
    const overview = computeOverview(tickets, NOW);
    expect(overview.active).toBe(tickets.filter((t) => t.status !== 'resolved').length);
    expect(overview.unassigned).toBe(4);
    expect(overview.overdue).toBeGreaterThan(0);
    expect(overview.csatCount).toBe(tickets.filter((t) => t.status === 'resolved').length);
  });

  it('reports no average when nothing qualifies', () => {
    const overview = computeOverview([], NOW);
    expect(overview.avgFirstResponseMin).toBeNull();
    expect(overview.csat).toBeNull();
  });

  it('reports how many first replies met their target', () => {
    const { pct, count } = firstReplyWithinTarget(tickets);
    expect(count).toBeGreaterThan(0);
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
    expect(firstReplyWithinTarget([]).pct).toBeNull();
  });

  it('buckets created and resolved tickets by day and labels long ranges with dates', () => {
    const week = dailyVolume(tickets, NOW, 7);
    expect(week).toHaveLength(7);
    expect(week.reduce((n, d) => n + d.created, 0)).toBe(tickets.filter((t) => NOW.getTime() - new Date(t.createdAt).getTime() < 6.5 * 86_400_000).length);
    const fortnight = dailyVolume(tickets, NOW, 14);
    expect(new Set(fortnight.map((d) => d.label)).size).toBe(14);
    expect(fortnight.reduce((n, d) => n + d.created, 0)).toBe(tickets.length);
  });
});
