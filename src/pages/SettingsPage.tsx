import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Button, CARD_TITLE, SelectField } from '../components/ui';
import { EMAIL_PATTERN } from '../lib/validation';
import { useStore } from '../state/useStore';
import type { WorkspaceSettings } from '../types';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Asia/Kolkata',
  'Australia/Sydney',
];

type NotificationKey = 'notifyNewTicket' | 'notifyCustomerReply' | 'notifySlaBreach' | 'notifyDailyDigest';

const NOTIFICATION_OPTIONS: { key: NotificationKey; label: string; hint: string }[] = [
  { key: 'notifyNewTicket', label: 'New tickets', hint: 'Stored for reference: this demo has no incoming tickets' },
  { key: 'notifyCustomerReply', label: 'Customer replies', hint: 'When a customer writes on a ticket. Try it with Simulate customer reply' },
  { key: 'notifySlaBreach', label: 'SLA breaches', hint: 'An alert for every reply that is past its target time' },
  { key: 'notifyDailyDigest', label: 'Daily digest', hint: 'Stored for reference: the demo sends no emails' },
];

type Errors = Partial<Record<keyof WorkspaceSettings, string>>;

function validate(draft: WorkspaceSettings): Errors {
  const errors: Errors = {};
  if (!draft.workspaceName.trim()) errors.workspaceName = 'Enter a workspace name.';
  if (!draft.companyName.trim()) errors.companyName = 'Enter the company name.';
  if (!EMAIL_PATTERN.test(draft.supportEmail)) errors.supportEmail = 'Enter a valid support email.';
  if (!draft.supportPhone.trim()) errors.supportPhone = 'Enter a support phone number.';
  if (!draft.workingHoursStart || !draft.workingHoursEnd) errors.workingHoursStart = 'Set both start and end times.';
  else if (draft.workingHoursStart >= draft.workingHoursEnd) errors.workingHoursStart = 'Start time must be before end time.';
  return errors;
}

export function SettingsPage() {
  const { data, currentAgent, actions } = useStore();
  const { hash } = useLocation();
  useEffect(() => {
    if (hash === '#demo-data') document.getElementById('demo-data')?.scrollIntoView();
  }, [hash]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader title="Settings" subtitle="Saved in this browser only" />
      <SettingsForm key={data.seededAt} saved={data.settings} onSave={(next) => actions.updateSettings(next)} />
      {currentAgent && (
        <section className="enter mb-6 max-w-3xl rounded-3xl bg-panel p-6">
          <h2 className={CARD_TITLE}>Your account</h2>
          <p className="mt-1 text-xs text-muted">Signed in as {currentAgent.name} ({currentAgent.role}), {currentAgent.email}.</p>
          <div className="mt-4">
            <Button onClick={actions.signOut}>Sign out</Button>
          </div>
        </section>
      )}
      <ResetDemoData onReset={actions.resetDemoData} />
    </div>
  );
}

function ResetDemoData({ onReset }: { onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <section id="demo-data" className="enter mb-6 max-w-3xl rounded-3xl bg-panel p-6">
      <h2 className={CARD_TITLE}>Demo data</h2>
      <p className="mt-1 text-xs text-muted">
        Tickets, agents, escalations and settings live in this browser and keep the times they were generated with. Reset to start again from fresh sample data.
        If you are signed in with an account added after the sample data, you will be signed out.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {confirming ? (
          <>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => { onReset(); setConfirming(false); }}>Reset everything</Button>
            <Button onClick={() => setConfirming(false)}>Cancel</Button>
          </>
        ) : (
          <Button onClick={() => setConfirming(true)}>Reset demo data</Button>
        )}
      </div>
    </section>
  );
}

interface SettingsFormProps {
  saved: WorkspaceSettings;
  onSave: (next: WorkspaceSettings) => void;
}

function SettingsForm({ saved, onSave }: SettingsFormProps) {
  const [draft, setDraft] = useState<WorkspaceSettings>(saved);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<string | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  function update<K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setStatus(null);
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus('Fix the highlighted fields to save.');
      return;
    }
    onSave(draft);
    setStatus('Settings saved in this browser.');
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-3xl flex-col gap-5 pb-6">
      <Section title="Workspace" description="The workspace name appears in the sidebar, sign-in page and browser tab. The company name appears under it.">
        <TextField label="Workspace name" value={draft.workspaceName} error={errors.workspaceName} onChange={(v) => update('workspaceName', v)} />
        <TextField label="Company name" value={draft.companyName} error={errors.companyName} onChange={(v) => update('companyName', v)} />
      </Section>

      <Section title="Support contact" description="Stored for reference. Nothing in the demo emails or calls these.">
        <TextField label="Support email" type="email" value={draft.supportEmail} error={errors.supportEmail} onChange={(v) => update('supportEmail', v)} />
        <TextField label="Support phone" type="tel" value={draft.supportPhone} error={errors.supportPhone} onChange={(v) => update('supportPhone', v)} />
      </Section>

      <Section title="Working hours" description="Timestamps in ticket threads use this timezone. Response deadlines do not use working hours yet.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField label="Start time" type="time" value={draft.workingHoursStart} error={errors.workingHoursStart} onChange={(v) => update('workingHoursStart', v)} />
          <TextField label="End time" type="time" value={draft.workingHoursEnd} onChange={(v) => update('workingHoursEnd', v)} />
          <FieldShell label="Business timezone">
            <SelectField label="Business timezone" className="w-full" value={draft.timezone} onChange={(e) => update('timezone', e.target.value)}>
              {TIMEZONES.map((zone) => (
                <option key={zone} value={zone}>{zone.replace(/_/g, ' ')}</option>
              ))}
            </SelectField>
          </FieldShell>
        </div>
      </Section>

      <Section title="Notifications" description="Choose which events notify you.">
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line">
          {NOTIFICATION_OPTIONS.map((option) => (
            <li key={option.key}>
              <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-xs text-muted">{option.hint}</span>
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(draft[option.key])}
                  onChange={(e) => update(option.key, e.target.checked)}
                  className="size-4 accent-accent focus-visible:outline-2 focus-visible:outline-accent"
                />
              </label>
            </li>
          ))}
        </ul>
      </Section>


      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-panel px-5 py-4 shadow-sm">
        <p role="status" aria-live="polite" className={`text-sm ${Object.keys(errors).length ? 'text-red-600' : 'text-muted'}`}>
          {status ?? (dirty ? 'You have unsaved changes.' : 'All changes saved.')}
        </p>
        <div className="flex gap-2">
          <Button onClick={() => { setDraft(saved); setErrors({}); setStatus(null); }} disabled={!dirty}>
            Discard changes
          </Button>
          <Button variant="primary" type="submit" disabled={!dirty}>
            Save settings
          </Button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="enter rounded-3xl bg-panel p-6">
      <h2 className={CARD_TITLE}>{title}</h2>
      <p className="mt-1 text-xs text-muted">{description}</p>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function FieldShell({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-body">{label}</span>
      {children}
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}
    </div>
  );
}

function TextField({
  label,
  value,
  error,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-body">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent aria-[invalid=true]:border-red-400"
      />
      {error && (
        <span id={`${id}-error`} className="text-xs font-medium text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}
