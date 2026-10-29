import { Link, Outlet, useLocation } from 'react-router-dom';
import { useNow } from '../lib/useNow';
import { useStore } from '../state/useStore';
import { Sidebar } from './Sidebar';

const DAY = 86_400_000;

export function AppShell() {
  // Keyed by section, so moving between pages fades in but opening another ticket does not.
  const section = useLocation().pathname.split('/')[1];
  const { data } = useStore();
  const now = useNow();
  // The demo's timestamps are relative to when it was generated, so after a day it needs a reset to look current.
  const ageDays = Math.floor((now.getTime() - new Date(data.seededAt).getTime()) / DAY);
  return (
    <div className="flex h-dvh gap-4 bg-canvas p-4 pb-24 md:gap-6 md:p-6">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-badge focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>
      <Sidebar />
      <main id="main" tabIndex={-1} className="flex min-w-0 flex-1 flex-col outline-none">
        {ageDays >= 1 && (
          <p role="status" className="mb-4 shrink-0 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This demo data was generated {ageDays === 1 ? 'a day' : `${ageDays} days`} ago, so times, overdue counts and charts look stale.{' '}
            <Link to="/settings#demo-data" className="font-semibold underline">Reset demo data</Link>
          </p>
        )}
        <div key={section} className="fade-in flex min-h-0 min-w-0 flex-1 flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
