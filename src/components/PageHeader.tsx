import { useEffect, type ReactNode } from 'react';
import { useStore } from '../state/useStore';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsMenu } from './NotificationsMenu';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

// Shared top bar: every page has the same title position, search and notifications entry point.
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const workspaceName = useStore().data.settings.workspaceName;
  // The browser tab and history show where you are, which a single-page app does not do by itself.
  useEffect(() => {
    document.title = `${title} · ${workspaceName}`;
  }, [title, workspaceName]);

  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-4 pb-5">
      <div className="min-w-0 flex-1 basis-64">
        <h1 className="text-2xl font-medium">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {actions}
        <GlobalSearch />
        <NotificationsMenu />
      </div>
    </header>
  );
}
