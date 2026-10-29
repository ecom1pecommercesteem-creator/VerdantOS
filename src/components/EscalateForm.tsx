import { useState } from 'react';
import { PRIORITY_LABELS, PRIORITY_ORDER } from '../lib/ticket';
import type { NewEscalation } from '../state/store';
import type { Agent, Ticket } from '../types';
import { Button, FIELD_CLASS, SelectField } from './ui';

interface EscalateFormProps {
  ticket: Ticket;
  developers: Agent[];
  onSubmit: (escalation: NewEscalation) => void;
  onCancel: () => void;
}

// Support hands a customer-reported problem to the developers, optionally picking who takes it.
export function EscalateForm({ ticket, developers, onSubmit, onCancel }: EscalateFormProps) {
  const [title, setTitle] = useState(ticket.subject);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(ticket.priority);
  const [assigneeId, setAssigneeId] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return setError('Give the issue a short title.');
    if (!description.trim()) return setError('Describe what is going wrong so the developer can reproduce it.');
    onSubmit({ ticketId: ticket.id, title, description, severity, assigneeId: assigneeId || null });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mb-6 flex flex-col gap-4 rounded-2xl border border-line bg-canvas/50 p-5">
      <h3 className="text-sm font-semibold">Escalate to developers</h3>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
        Issue title
        <input value={title} onChange={(e) => { setTitle(e.target.value); setError(null); }} className={FIELD_CLASS} autoFocus />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
        What is going wrong
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); setError(null); }}
          rows={3}
          placeholder="Steps to reproduce, what the customer sees, and what they expected."
          className={`${FIELD_CLASS} resize-none`}
        />
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 text-sm font-medium text-body">
          <span aria-hidden="true">Severity</span>
          <SelectField label="Severity" className="w-full" value={severity} onChange={(e) => setSeverity(e.target.value as Ticket['priority'])}>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </SelectField>
        </div>
        <div className="flex flex-col gap-1.5 text-sm font-medium text-body">
          <span aria-hidden="true">Assign to developer</span>
          <SelectField label="Assign to developer" className="w-full" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Unassigned (developers pick it up)</option>
            {developers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </SelectField>
        </div>
      </div>
      {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">Send to developers</Button>
      </div>
    </form>
  );
}
