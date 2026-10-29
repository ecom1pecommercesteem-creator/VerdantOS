import { useState } from 'react';
import { Link } from 'react-router-dom';
import { stagger } from '../components/motion';
import { PageHeader } from '../components/PageHeader';
import { Avatar, Button, CARD_TITLE, FIELD_CLASS, FilterTabs, SelectField } from '../components/ui';
import { AVAILABILITY_LABELS } from '../lib/agents';
import { EMAIL_PATTERN } from '../lib/validation';
import { formatDuration } from '../lib/format';
import { isDeveloper } from '../lib/escalation';
import { hashPassword } from '../lib/password';
import { agentStats, workloadLevel, type Workload } from '../lib/metrics';
import { useNow } from '../lib/useNow';
import { useStore } from '../state/useStore';
import type { Agent, AgentAvailability } from '../types';

const AVAILABILITY_DOT: Record<AgentAvailability, string> = {
  online: 'bg-emerald-500',
  away: 'bg-amber-400',
  offline: 'bg-slate-300',
};

const WORKLOAD_STYLE: Record<Workload, { label: string; bar: string; text: string }> = {
  light: { label: 'Light', bar: 'bg-emerald-400', text: 'text-emerald-700' },
  steady: { label: 'Steady', bar: 'bg-amber-400', text: 'text-amber-700' },
  heavy: { label: 'Heavy', bar: 'bg-red-500', text: 'text-red-600' },
};

type AvailabilityFilter = AgentAvailability | 'all';

function AddAgentForm({ agents, onAdd, onCancel }: { agents: Agent[]; onAdd: (agent: Pick<Agent, 'name' | 'email' | 'role' | 'passwordHash'>) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Agent['role']>('Support Agent');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return setError('Enter the agent’s name.');
    if (!EMAIL_PATTERN.test(email)) return setError('Enter a valid work email.');
    if (agents.some((a) => a.email.toLowerCase() === email.trim().toLowerCase())) return setError('An agent with this email already exists.');
    if (password.length < 8) return setError('The temporary password needs at least 8 characters.');
    onAdd({ name, email, role, passwordHash: await hashPassword(password) });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="enter flex flex-col gap-4 rounded-3xl bg-panel p-6">
      <h2 className={CARD_TITLE}>Add agent</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
          Full name
          <input value={name} onChange={(e) => { setName(e.target.value); setError(null); }} className={FIELD_CLASS} autoFocus />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
          Work email
          <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} className={FIELD_CLASS} />
        </label>
        <div className="flex flex-col gap-1.5 text-sm font-medium text-body">
          <span aria-hidden="true">Role</span>
          <SelectField label="Role" className="w-full" value={role} onChange={(e) => setRole(e.target.value as Agent['role'])}>
            <option value="Support Agent">Support Agent</option>
            <option value="Support Lead">Support Lead</option>
            <option value="Developer">Developer</option>
          </SelectField>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
          Temporary password
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} className={FIELD_CLASS} />
        </label>
      </div>
      {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">Add agent</Button>
      </div>
    </form>
  );
}

export function TeamPage() {
  const { data, currentAgent, actions } = useStore();
  const now = useNow();
  const [filter, setFilter] = useState<AvailabilityFilter>('all');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const lead = currentAgent?.role === 'Support Lead';
  // Developers are measured on the issues escalated to them rather than on tickets.
  const stats = agentStats(data.agents, data.tickets, data.escalations);
  const visible = stats.filter((row) => filter === 'all' || row.agent.availability === filter);
  const heavy = stats.filter((row) => !isDeveloper(row.agent) && workloadLevel(row.active) === 'heavy');
  const tabs: AvailabilityFilter[] = ['all', 'online', 'away', 'offline'];

  const Person = ({ agent }: { agent: Agent }) => (
    <div className="flex items-center gap-3">
      <Avatar name={agent.name} size="sm" />
      <div>
        <p className="font-medium">{agent.name}</p>
        <p className="text-xs text-muted">{agent.role}</p>
      </div>
    </div>
  );
  const availability = (agent: Agent) => (
    <div className="flex items-center gap-2">
      <span className={`size-2 rounded-full ${AVAILABILITY_DOT[agent.availability]}`} aria-hidden="true" />
      <SelectField
        label={`Availability for ${agent.name}`}
        value={agent.availability}
        disabled={!lead && agent.id !== currentAgent?.id}
        onChange={(e) => actions.setAgentAvailability(agent.id, e.target.value as AgentAvailability)}
      >
        {(Object.keys(AVAILABILITY_LABELS) as AgentAvailability[]).map((value) => (
          <option key={value} value={value}>{AVAILABILITY_LABELS[value]}</option>
        ))}
      </SelectField>
    </div>
  );
  const workloadBar = (active: number) => {
    const style = WORKLOAD_STYLE[workloadLevel(active)];
    return (
      <div className="flex items-center gap-3">
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
          <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${Math.min(100, active * 20)}%` }} />
        </div>
        <span className={`text-xs font-medium ${style.text}`}>{style.label}</span>
      </div>
    );
  };
  const actionsFor = (agent: Agent) => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 xl:justify-end">
      <Link
        to={isDeveloper(agent) ? '/developers' : `/tickets?assignee=${agent.id}`}
        className="text-sm font-medium text-accent hover:underline"
      >
        {isDeveloper(agent) ? 'View issues' : 'View tickets'}
      </Link>
      {lead && agent.id !== currentAgent?.id && (
        removingId === agent.id ? (
          <span className="flex items-center gap-2">
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => { actions.removeAgent(agent.id); setRemovingId(null); }}>
              Remove {agent.name.split(' ')[0]}
            </Button>
            <Button onClick={() => setRemovingId(null)}>Cancel</Button>
          </span>
        ) : (
          <button type="button" onClick={() => setRemovingId(agent.id)} className="text-sm font-medium text-red-600 hover:underline focus-visible:outline-2 focus-visible:outline-accent">
            Remove
          </button>
        )
      )}
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader
        title="Team"
        subtitle={`${data.agents.length} agents · ${data.agents.filter((a) => a.availability === 'online').length} online`}
        actions={lead && !adding ? <Button variant="primary" onClick={() => setAdding(true)}>Add agent</Button> : undefined}
      />

      <div className="flex flex-col gap-5 pb-6">
        {adding && (
          <AddAgentForm
            agents={data.agents}
            onAdd={(agent) => { actions.addAgent(agent); setAdding(false); }}
            onCancel={() => setAdding(false)}
          />
        )}
        {heavy.length > 0 && (
          <div role="status" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
            <span className="font-semibold">Heavy workload:</span> {heavy.map((row) => row.agent.name).join(', ')} {heavy.length === 1 ? 'has' : 'have'} 5 or more active tickets. Consider reassigning from the Tickets page.
          </div>
        )}

        <FilterTabs
          variant="pill"
          label="Filter by availability"
          value={filter}
          onChange={setFilter}
          options={tabs.map((tab) => ({
            value: tab,
            label: tab === 'all' ? 'All agents' : AVAILABILITY_LABELS[tab],
            count: tab === 'all' ? stats.length : stats.filter((row) => row.agent.availability === tab).length,
          }))}
        />

        <div style={stagger(1)} className="enter hidden overflow-x-auto rounded-3xl bg-panel xl:block">
          <table className="w-full min-w-[860px] text-left text-sm">
            <caption className="sr-only">Support agents, availability and workload</caption>
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Agent</th>
                <th scope="col" className="px-4 py-3 font-medium">Availability</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Active</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Resolved</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Avg first response</th>
                <th scope="col" className="px-4 py-3 font-medium">Workload</th>
                <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((row) => (
                <tr key={row.agent.id}>
                  <td className="px-4 py-4"><Person agent={row.agent} /></td>
                  <td className="px-4 py-4">{availability(row.agent)}</td>
                  <td className="px-4 py-4 text-right font-medium tabular-nums">{row.active}</td>
                  <td className="px-4 py-4 text-right tabular-nums">{row.resolved}</td>
                  <td className="px-4 py-4 text-right tabular-nums">{formatDuration(row.avgFirstResponseMin)}</td>
                  <td className="px-4 py-4">{workloadBar(row.active)}</td>
                  <td className="px-4 py-4">{actionsFor(row.agent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul aria-label="Support agents" className="flex flex-col gap-3 xl:hidden">
          {visible.map((row) => (
            <li key={row.agent.id} style={stagger(1)} className="enter flex flex-col gap-3 rounded-3xl bg-panel p-5">
              <Person agent={row.agent} />
              {availability(row.agent)}
              <p className="text-sm text-muted tabular-nums">
                {row.active} active · {row.resolved} resolved · first response {formatDuration(row.avgFirstResponseMin)}
              </p>
              {workloadBar(row.active)}
              {actionsFor(row.agent)}
            </li>
          ))}
        </ul>
        {visible.length === 0 && <p className="rounded-3xl bg-panel px-5 py-8 text-center text-sm text-muted">No agents are {filter === 'all' ? 'in the team' : AVAILABILITY_LABELS[filter as AgentAvailability].toLowerCase()} right now.</p>}
        <p className="text-xs text-muted">Last refreshed {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. Workload: 0 to 2 tickets light, 3 to 4 steady, 5 or more heavy.</p>
      </div>
    </div>
  );
}
