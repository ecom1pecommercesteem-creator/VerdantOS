import { describe, expect, it } from 'vitest';
import { buildSeed } from '../data/seed';
import { reducer } from './reducer';

const NOW = new Date('2026-10-27T12:00:00Z');
const AT = '2026-10-27T12:05:00.000Z';
const seed = () => buildSeed(NOW);
const ticket = (state: ReturnType<typeof seed>, id: string) => state.tickets.find((t) => t.id === id)!;

describe('ticket changes', () => {
  it('moves a ticket to waiting-for-customer and assigns the replier when an agent replies', () => {
    const next = reducer(seed(), { type: 'tickets/reply', ticketId: 'TKT-1042', body: '  On it.  ', agentId: 'agt-daniel', at: AT });
    const t = ticket(next, 'TKT-1042');
    expect(t.status).toBe('waiting_customer');
    expect(t.assigneeId).toBe('agt-daniel');
    expect(t.messages.at(-1)?.body).toBe('On it.');
  });

  it('ignores empty replies and replies on resolved tickets', () => {
    const state = seed();
    expect(reducer(state, { type: 'tickets/reply', ticketId: 'TKT-1042', body: '   ', agentId: 'agt-daniel', at: AT })).toBe(state);
    const resolved = reducer(state, { type: 'tickets/reply', ticketId: 'TKT-1045', body: 'Hi', agentId: 'agt-daniel', at: AT });
    expect(ticket(resolved, 'TKT-1045').messages).toHaveLength(ticket(state, 'TKT-1045').messages.length);
  });

  it('clears the rating and restarts the reply deadline when a resolved ticket is reopened', () => {
    const reopened = reducer(seed(), { type: 'tickets/update', ticketIds: ['TKT-1045'], changes: { status: 'open' }, actorId: 'agt-priya', at: AT });
    const t = ticket(reopened, 'TKT-1045');
    expect(t.csat).toBeNull();
    expect(t.resolvedAt).toBeNull();
    expect(t.reopenedAt).toBe(AT);
  });

  it('tells the new assignee, but not someone who assigns to themselves', () => {
    const assigned = reducer(seed(), { type: 'tickets/update', ticketIds: ['TKT-1042'], changes: { assigneeId: 'agt-sofia' }, actorId: 'agt-priya', at: AT });
    expect(assigned.notifications[0]).toMatchObject({ recipientId: 'agt-sofia', ticketId: 'TKT-1042' });
    const self = seed();
    const own = reducer(self, { type: 'tickets/update', ticketIds: ['TKT-1042'], changes: { assigneeId: 'agt-sofia' }, actorId: 'agt-sofia', at: AT });
    expect(own.notifications).toHaveLength(self.notifications.length);
  });

  it('lets the customer reply back, and only notifies when that setting is on', () => {
    const waiting = reducer(seed(), { type: 'tickets/customerReply', ticketId: 'TKT-1043', body: 'Found it, thanks.', at: AT });
    expect(ticket(waiting, 'TKT-1043').status).toBe('in_progress');
    expect(waiting.notifications[0]).toMatchObject({ title: 'Customer replied', recipientId: 'agt-hana' });
    const muted = seed();
    muted.settings.notifyCustomerReply = false;
    const quiet = reducer(muted, { type: 'tickets/customerReply', ticketId: 'TKT-1043', body: 'Found it, thanks.', at: AT });
    expect(quiet.notifications).toHaveLength(muted.notifications.length);
  });
});

describe('permissions', () => {
  it('only lets a lead add or remove agents', () => {
    const state = seed();
    const agent = { name: 'New Hire', email: 'new.hire@harborthread.example', role: 'Support Agent' as const, passwordHash: 'x' };
    expect(reducer(state, { type: 'agents/add', agent, actorId: 'agt-daniel' })).toBe(state);
    expect(reducer(state, { type: 'agents/add', agent, actorId: 'agt-priya' }).agents).toHaveLength(state.agents.length + 1);
    expect(reducer(state, { type: 'agents/remove', agentId: 'agt-hana', actorId: 'agt-daniel', at: AT })).toBe(state);
    expect(reducer(state, { type: 'agents/remove', agentId: 'agt-priya', actorId: 'agt-priya', at: AT })).toBe(state); // a lead cannot remove themselves
  });

  it('returns a removed agent\'s active tickets to the unassigned queue', () => {
    const next = reducer(seed(), { type: 'agents/remove', agentId: 'agt-hana', actorId: 'agt-priya', at: AT });
    expect(ticket(next, 'TKT-1043').assigneeId).toBeNull();
    expect(next.agents.some((a) => a.id === 'agt-hana')).toBe(false);
  });

  it('lets agents change only their own availability unless they lead', () => {
    const state = seed();
    expect(reducer(state, { type: 'agents/availability', agentId: 'agt-hana', availability: 'online', actorId: 'agt-daniel' })).toBe(state);
    expect(reducer(state, { type: 'agents/availability', agentId: 'agt-daniel', availability: 'away', actorId: 'agt-daniel' }).agents.find((a) => a.id === 'agt-daniel')?.availability).toBe('away');
    expect(reducer(state, { type: 'agents/availability', agentId: 'agt-hana', availability: 'online', actorId: 'agt-priya' }).agents.find((a) => a.id === 'agt-hana')?.availability).toBe('online');
  });
});

describe('escalations', () => {
  it('only assigns developers', () => {
    const state = seed();
    const base = { ticketId: 'TKT-1042', title: 'Form does not save', description: 'Resets on submit.', severity: 'high' as const };
    expect(reducer(state, { type: 'escalations/create', escalation: { ...base, assigneeId: 'agt-daniel' }, actorId: 'agt-priya', at: AT })).toBe(state);
    const created = reducer(state, { type: 'escalations/create', escalation: { ...base, assigneeId: 'agt-sam' }, actorId: 'agt-priya', at: AT });
    expect(created.escalations[0]).toMatchObject({ id: 'ESC-204', status: 'open', assigneeId: 'agt-sam' });
    expect(created.notifications[0]).toMatchObject({ recipientId: 'agt-sam' });
  });

  it('tells the reporter when an issue is fixed and records it on the ticket', () => {
    const next = reducer(seed(), { type: 'escalations/update', escalationId: 'ESC-201', changes: { status: 'fixed' }, actorId: 'agt-sam', at: AT });
    expect(next.notifications[0]).toMatchObject({ title: 'Issue fixed', recipientId: 'agt-priya' });
    expect(ticket(next, 'TKT-1042').activity.at(-1)?.text).toContain('ESC-201 is now Fixed');
  });
});

describe('demo data', () => {
  it('rebuilds the sample data from scratch', () => {
    const changed = reducer(seed(), { type: 'tickets/update', ticketIds: ['TKT-1042'], changes: { status: 'resolved' }, actorId: 'agt-priya', at: AT });
    const reset = reducer(changed, { type: 'data/reset', at: AT });
    expect(ticket(reset, 'TKT-1042').status).toBe('open');
    expect(reset.seededAt).toBe(AT);
  });
});
