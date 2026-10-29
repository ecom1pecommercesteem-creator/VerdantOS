import { Headset } from 'lucide-react';
import { useState } from 'react';
import { Button, FIELD_CLASS } from '../components/ui';
import { agents, DEMO_PASSWORD, developers } from '../data/seed';
import { useStore } from '../state/useStore';

// One account per role, so a visitor can see what a lead, an agent and a developer each get.
const DEMO_ACCOUNTS = [
  agents.find((a) => a.role === 'Support Lead'),
  agents.find((a) => a.role === 'Support Agent'),
  developers[0],
].filter((a) => a !== undefined);

export function LoginPage() {
  const { data, actions } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const ok = await actions.signIn(email, password);
      // On success the app swaps this page for the dashboard, so only failure needs handling here.
      if (!ok) setError('Incorrect email or password.');
    } catch {
      // Hashing needs a secure context (HTTPS or localhost); without one the check cannot run at all.
      setError('Sign-in is not available in this browser context. Open the app over HTTPS or on localhost.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-4">
      <div className="enter flex w-full max-w-sm flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-[32px] bg-panel p-8">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-white">
            <Headset className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-medium">Sign in</h1>
            <p className="mt-1 text-sm text-muted">{data.settings.workspaceName}</p>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
            Email
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              autoFocus
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              aria-invalid={error ? true : undefined}
              className={FIELD_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              aria-invalid={error ? true : undefined}
              className={FIELD_CLASS}
            />
          </label>
          {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
          <Button variant="primary" type="submit" disabled={busy}>Sign in</Button>
        </form>

        <section aria-labelledby="demo-accounts" className="rounded-3xl bg-panel p-5">
          <h2 id="demo-accounts" className="text-sm font-semibold">Demo accounts</h2>
          <p className="mt-1 text-xs text-muted">
            This is a portfolio demo with sample data. Every account uses the password <code className="rounded bg-canvas px-1 py-0.5 font-mono text-ink">{DEMO_PASSWORD}</code>.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.id}>
                <button
                  type="button"
                  onClick={() => { setEmail(account.email); setPassword(DEMO_PASSWORD); setError(null); }}
                  className="flex w-full flex-col rounded-xl border border-line px-3 py-2 text-left hover:bg-canvas focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className="text-sm font-medium">{account.name} <span className="font-normal text-muted">· {account.role}</span></span>
                  <span className="text-xs text-muted">{account.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
