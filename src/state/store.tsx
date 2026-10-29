import { useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { StoreContext } from './storeContext';
import { agents as seedAgents, buildEscalations, buildSeed, buildSettings, developers as seedDevelopers } from '../data/seed';
import { hashPassword } from '../lib/password';
import { CUSTOMER_REPLIES } from '../lib/templates';
import { reducer, type Action, type EscalationChanges, type NewAgent, type NewEscalation, type TicketChanges } from './reducer';
import type { Agent, AgentAvailability, AppData, WorkspaceSettings } from '../types';

export type { EscalationChanges, NewAgent, NewEscalation, TicketChanges };

const STORAGE_KEY = 'harbor-thread-support:v1';
const SESSION_KEY = 'harbor-thread-support:session';

// Reads saved data. Falls back to the seed if storage is empty, blocked or malformed.
function loadState(): AppData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppData>;
      // An empty agent list would leave nobody able to sign in, so it counts as unusable data.
      if (Array.isArray(parsed.tickets) && Array.isArray(parsed.agents) && parsed.agents.length > 0 && parsed.settings) {
        // Data saved before escalations existed gets the developers and sample escalations added once.
        const predatesEscalations = parsed.escalations === undefined;
        const savedAgents = parsed.agents.map((a) => ({ ...[...seedAgents, ...seedDevelopers].find((s) => s.id === a.id), ...a }));
        return {
          tickets: parsed.tickets,
          escalations: parsed.escalations ?? buildEscalations(),
          // Backfill fields added after the data was saved, such as credentials.
          agents: predatesEscalations ? [...savedAgents, ...seedDevelopers.filter((d) => !savedAgents.some((a) => a.id === d.id))] : savedAgents,
          notifications: parsed.notifications ?? [],
          settings: { ...buildSettings(), ...parsed.settings },
          seededAt: parsed.seededAt ?? new Date().toISOString(),
        };
      }
      
    }
  } catch {
    // Storage unavailable or corrupted: use the seed below.
  }
  return buildSeed();
}

function saveState(state: AppData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is a convenience. The app keeps working in memory.
  }
}

interface Session {
  agentId: string | null;
  agents: Agent[];
  setAgentId: (id: string | null) => void;
}

const AUTO_REPLY_MIN_MS = 2000;
const AUTO_REPLY_SPREAD_MS = 3000;

function createActions(dispatch: (action: Action) => void, session: Session) {
  // Every write is attributed to the signed-in agent. The app only renders these when someone is signed in.
  const actor = () => {
    if (!session.agentId) throw new Error('Not signed in');
    return session.agentId;
  };
  // Demo only: there is no real customer, so this stands in for one writing back with a random line.
  const customerReply = (ticketId: string) => {
    const body = CUSTOMER_REPLIES[Math.floor(Math.random() * CUSTOMER_REPLIES.length)];
    dispatch({ type: 'tickets/customerReply', ticketId, body, at: new Date().toISOString() });
  };
  return {
    async signIn(email: string, password: string): Promise<boolean> {
      const hash = await hashPassword(password);
      const agent = session.agents.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
      if (!agent || agent.passwordHash !== hash) return false;
      session.setAgentId(agent.id);
      return true;
    },
    signOut() {
      session.setAgentId(null);
    },
    updateTickets(ticketIds: string[], changes: TicketChanges, actorId = actor()) {
      dispatch({ type: 'tickets/update', ticketIds, changes, actorId, at: new Date().toISOString() });
    },
    replyToTicket(ticketId: string, body: string, agentId = actor()) {
      dispatch({ type: 'tickets/reply', ticketId, body, agentId, at: new Date().toISOString() });
      // Demo only: with no real customer, one answers after a few seconds. The reducer ignores it if the ticket was resolved meanwhile.
      window.setTimeout(() => customerReply(ticketId), AUTO_REPLY_MIN_MS + Math.random() * AUTO_REPLY_SPREAD_MS);
    },
    addInternalNote(ticketId: string, body: string, agentId = actor()) {
      dispatch({ type: 'tickets/note', ticketId, body, agentId, at: new Date().toISOString() });
    },
    simulateCustomerReply: customerReply,
    createEscalation(escalation: NewEscalation) {
      dispatch({ type: 'escalations/create', escalation, actorId: actor(), at: new Date().toISOString() });
    },
    updateEscalation(escalationId: string, changes: EscalationChanges) {
      dispatch({ type: 'escalations/update', escalationId, changes, actorId: actor(), at: new Date().toISOString() });
    },
    setAgentAvailability(agentId: string, availability: AgentAvailability) {
      dispatch({ type: 'agents/availability', agentId, availability, actorId: actor() });
    },
    addAgent(agent: NewAgent) {
      dispatch({ type: 'agents/add', agent, actorId: actor() });
    },
    removeAgent(agentId: string) {
      dispatch({ type: 'agents/remove', agentId, actorId: actor(), at: new Date().toISOString() });
    },
    updateSettings(patch: Partial<WorkspaceSettings>) {
      dispatch({ type: 'settings/update', patch });
    },
    markNotificationRead(id: string) {
      dispatch({ type: 'notifications/read', id });
    },
    markAllNotificationsRead() {
      dispatch({ type: 'notifications/readAll' });
    },
    resetDemoData() {
      dispatch({ type: 'data/reset', at: new Date().toISOString() });
    },
  };
}

export type StoreActions = ReturnType<typeof createActions>;

function loadSession(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, loadState);
  const [agentId, setAgentId] = useState<string | null>(loadSession);

  useEffect(() => {
    saveState(data);
  }, [data]);

  useEffect(() => {
    try {
      if (agentId) window.localStorage.setItem(SESSION_KEY, agentId);
      else window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // Without storage the session lasts until the page is closed.
    }
  }, [agentId]);

  // A removed agent's saved session no longer matches anyone, so they are signed out.
  const currentAgent = data.agents.find((a) => a.id === agentId) ?? null;

  const value = useMemo(
    () => ({ data, currentAgent, actions: createActions(dispatch, { agentId: currentAgent?.id ?? null, agents: data.agents, setAgentId }) }),
    [data, currentAgent],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
