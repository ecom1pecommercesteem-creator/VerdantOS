import { describe, expect, it } from 'vitest';
import { hashPassword } from '../lib/password';
import { buildSeed, customers, DEMO_PASSWORD, INITIAL_PASSWORD_HASH, orders } from './seed';

const NOW = new Date('2026-10-27T12:00:00Z');
const seed = buildSeed(NOW);

describe('seed data', () => {
  it('lists every thread in time order, starting with the message that created the ticket', () => {
    for (const ticket of seed.tickets) {
      const times = ticket.messages.map((m) => m.createdAt);
      expect([...times].sort(), ticket.id).toEqual(times);
      expect(ticket.createdAt, ticket.id).toBe(times[0]);
      expect(ticket.messages[0].author, ticket.id).toBe('customer');
    }
  });

  it('only refers to customers, orders and agents that exist', () => {
    const agentIds = new Set(seed.agents.map((a) => a.id));
    for (const ticket of seed.tickets) {
      expect(customers.some((c) => c.id === ticket.customerId), ticket.id).toBe(true);
      if (ticket.orderId) expect(orders.some((o) => o.id === ticket.orderId && o.customerId === ticket.customerId), ticket.id).toBe(true);
      if (ticket.assigneeId) expect(agentIds.has(ticket.assigneeId), ticket.id).toBe(true);
    }
  });

  it('spans more than a week so the 14-day analytics range differs from 7 days', () => {
    const oldest = Math.min(...seed.tickets.map((t) => new Date(t.createdAt).getTime()));
    expect(NOW.getTime() - oldest).toBeGreaterThan(8 * 86_400_000);
  });

  it('documents a demo password that matches the stored hash', async () => {
    expect(await hashPassword(DEMO_PASSWORD)).toBe(INITIAL_PASSWORD_HASH);
  });
});
