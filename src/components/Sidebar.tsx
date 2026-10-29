import { BarChart3, Bug, Headset, LayoutDashboard, LogOut, Settings, Ticket, UserRound, UsersRound, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Avatar } from './ui';
import { useStore } from '../state/useStore';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: 'open';
  pinToBottom?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tickets', label: 'Tickets', icon: Ticket, badge: 'open' },
  { to: '/customers', label: 'Customers', icon: UserRound },
  { to: '/developers', label: 'Developers', icon: Bug },
  { to: '/team', label: 'Team', icon: UsersRound },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings, pinToBottom: true },
];

// A floating sidebar with icon and label on desktop. On small screens it becomes an icon-only bottom bar, so navigation is always reachable.
export function Sidebar() {
  const { data, currentAgent, actions } = useStore();
  const openCount = data.tickets.filter((t) => t.status !== 'resolved').length;

  return (
    <aside
      aria-label={data.settings.workspaceName}
      className="enter fixed inset-x-4 bottom-4 z-30 flex items-center rounded-full bg-panel p-2 shadow-lg md:static md:inset-auto md:z-auto md:w-64 md:shrink-0 md:flex-col md:items-stretch md:rounded-[32px] md:p-4 md:shadow-none"
    >
      <div className="mb-5 hidden items-center gap-3 px-1 pt-1 md:flex">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-white">
          <Headset className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm leading-tight font-semibold">{data.settings.workspaceName}</p>
          <p className="truncate text-xs text-muted">{data.settings.companyName}</p>
        </div>
      </div>
      <nav aria-label="Main" className="flex flex-1 items-center justify-around md:flex-col md:items-stretch md:justify-start md:gap-1.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, badge, pinToBottom }) => {
          const accessibleName = badge === 'open' ? `${label}, ${openCount} active` : label;
          return (
            <NavLink
              key={to}
              to={to}
              title={label}
              aria-label={accessibleName}
              className={({ isActive }) =>
                `relative flex size-12 items-center justify-center gap-3 rounded-full transition-colors md:h-12 md:w-auto md:justify-start md:px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isActive ? 'bg-badge text-white' : 'text-body hover:bg-canvas'
                } ${pinToBottom ? 'md:mt-auto' : ''}`
              }
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="hidden text-sm font-medium md:inline">{label}</span>
              {badge === 'open' && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white tabular-nums ring-2 ring-panel md:static md:ml-auto md:min-w-6 md:px-1.5 md:py-0.5 md:text-xs md:ring-0"
                >
                  {openCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
      {currentAgent && (
        <div className="mt-3 hidden items-center gap-3 rounded-2xl bg-canvas p-3 md:flex">
          <Avatar name={currentAgent.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{currentAgent.name}</p>
            <p className="truncate text-xs text-muted">{currentAgent.role}</p>
          </div>
          <button
            type="button"
            onClick={actions.signOut}
            title="Sign out"
            aria-label="Sign out"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-body transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-accent"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </aside>
  );
}
