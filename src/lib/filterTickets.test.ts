import { describe, expect, it } from 'vitest';
import { buildSeed } from '../data/seed';
import { DEFAULT_FILTERS, filterTickets } from './filterTickets';

const NOW = new Date('2026-10-27T12:00:00Z');
const tickets = buildSeed(NOW).tickets;
const ids = (query: Partial<typeof DEFAULT_FILTERS>) => filterTickets(tickets, { ...DEFAULT_FILTERS, ...query }, NOW).map((t) => t.id);

describe('filterTickets', () => {
  it('finds tickets by id, order number, customer name and email', () => {
    expect(ids({ query: 'TKT-1056' })).toEqual(['TKT-1056']);
    expect(ids({ query: 'ORD-10533' }).sort()).toEqual(['TKT-1041', 'TKT-1056']);
    expect(ids({ query: 'noah' })).toContain('TKT-1056');
    expect(ids({ query: 'noah.fischer@example.com' })).toContain('TKT-1041');
  });

  it('combines filters', () => {
    const result = ids({ view: 'unassigned', status: 'open' });
    expect(result.length).toBeGreaterThan(0);
    for (const id of result) {
      const t = tickets.find((x) => x.id === id)!;
      expect(t.assigneeId).toBeNull();
      expect(t.status).toBe('open');
    }
  });

  it('quick views match the dashboard definitions', () => {
    expect(ids({ view: 'active' })).toHaveLength(tickets.filter((t) => t.status !== 'resolved').length);
    expect(ids({ view: 'overdue' })).toContain('TKT-1056');
    expect(ids({ view: 'awaiting' })).not.toContain('TKT-1043');
  });
});
