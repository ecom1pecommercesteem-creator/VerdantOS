import { describe, expect, it } from 'vitest';
import { buildSeed } from '../data/seed';
import { isAwaitingResponse, isOverdue, minutesUntilDue, SLA_MINUTES } from './ticket';

const NOW = new Date('2026-10-27T12:00:00Z');
const tickets = buildSeed(NOW).tickets;
const get = (id: string) => tickets.find((t) => t.id === id)!;

describe('reply deadlines', () => {
  it('owes a reply only when the customer wrote last on an active ticket', () => {
    expect(isAwaitingResponse(get('TKT-1056'))).toBe(true); // customer wrote last
    expect(isAwaitingResponse(get('TKT-1043'))).toBe(false); // agent wrote last
    expect(isAwaitingResponse(get('TKT-1045'))).toBe(false); // resolved
  });

  it('treats the customer\'s last message on TKT-1053 as the newest, so a reply is owed', () => {
    const ticket = get('TKT-1053');
    expect(ticket.messages.at(-1)?.author).toBe('customer');
    expect(isAwaitingResponse(ticket)).toBe(true);
    expect(isOverdue(ticket, NOW)).toBe(true); // 720 minutes ago against a 4 hour target
  });

  it('counts the deadline from the last customer message by priority', () => {
    const ticket = get('TKT-1056'); // urgent, customer wrote 75 min ago
    expect(SLA_MINUTES.urgent).toBe(60);
    expect(minutesUntilDue(ticket, NOW)).toBe(-15);
    expect(isOverdue(ticket, NOW)).toBe(true);
    expect(minutesUntilDue(get('TKT-1050'), NOW)).toBe(8 * 60 - 50); // medium, 50 min ago
  });

  it('restarts the deadline when a resolved ticket is reopened', () => {
    const reopened = { ...get('TKT-1045'), status: 'open' as const, resolvedAt: null }; // closed days ago after "Perfect, thanks!"
    expect(isOverdue(reopened, NOW)).toBe(true); // measured from the old message
    const fresh = { ...reopened, reopenedAt: NOW.toISOString() };
    expect(isOverdue(fresh, NOW)).toBe(false);
    expect(minutesUntilDue(fresh, NOW)).toBe(SLA_MINUTES.low);
  });
});
