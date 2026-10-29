import { Search, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Avatar, FilterTabs, OrderStatusBadge, StatusBadge } from '../components/ui';
import { customers, orders } from '../data/seed';
import { formatDateTime, formatRelative } from '../lib/format';
import { isActive } from '../lib/ticket';
import { useNow } from '../lib/useNow';
import { useStore } from '../state/useStore';
import type { Customer, CustomerStatus, Ticket } from '../types';

const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  vip: 'VIP',
  active: 'Active',
  at_risk: 'At risk',
};

const CUSTOMER_STATUS_STYLE: Record<CustomerStatus, string> = {
  vip: 'bg-violet-50 text-violet-700 ring-violet-200',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  at_risk: 'bg-red-50 text-red-700 ring-red-200',
};

type StatusFilter = CustomerStatus | 'all';

function lastInteraction(tickets: Ticket[]): string | null {
  if (tickets.length === 0) return null;
  return tickets.reduce((latest, t) => (t.updatedAt > latest ? t.updatedAt : latest), tickets[0].updatedAt);
}

export function CustomersPage() {
  const { customerId } = useParams();
  const { data } = useStore();
  const now = useNow();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const rows = customers
    .map((customer) => {
      const tickets = data.tickets.filter((t) => t.customerId === customer.id);
      return { customer, tickets, open: tickets.filter(isActive).length, last: lastInteraction(tickets) };
    })
    .filter(({ customer }) => {
      if (statusFilter !== 'all' && customer.status !== statusFilter) return false;
      const needle = query.trim().toLowerCase();
      return !needle || `${customer.name} ${customer.email}`.toLowerCase().includes(needle);
    })
    .sort((a, b) => (b.last ?? '').localeCompare(a.last ?? ''));

  const selected = customerId ? customers.find((c) => c.id === customerId) : undefined;
  const tabs: StatusFilter[] = ['all', 'vip', 'active', 'at_risk'];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Customers" subtitle={`${customers.length} customers`} />

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-3xl bg-panel">
        <section className={`${customerId ? 'hidden xl:flex' : 'flex'} min-h-0 w-full flex-col xl:w-[420px] xl:shrink-0 xl:border-r xl:border-line`}>
          <div className="px-5 pt-5">
            <label className="flex items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 focus-within:ring-2 focus-within:ring-accent">
              <Search className="size-4 text-subtle" aria-hidden="true" />
              <span className="sr-only">Search customers by name or email</span>
              <input
                type="search"
                name="customer-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name or email"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-subtle hover:text-ink">
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </label>
          </div>
          <FilterTabs
            label="Filter by customer status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={tabs.map((tab) => ({ value: tab, label: tab === 'all' ? 'All' : CUSTOMER_STATUS_LABELS[tab] }))}
          />
          <ul className="min-h-0 flex-1 overflow-y-auto" aria-label="Customers">
            {rows.map(({ customer, tickets, open, last }) => (
              <li key={customer.id} className="border-b border-line">
                <Link
                  to={`/customers/${customer.id}`}
                  aria-current={customer.id === customerId ? 'true' : undefined}
                  className={`flex items-center gap-3 px-5 py-4 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                    customer.id === customerId ? 'bg-accent-soft/60' : 'hover:bg-canvas/60'
                  }`}
                >
                  <Avatar name={customer.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{customer.name}</span>
                      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${CUSTOMER_STATUS_STYLE[customer.status]}`}>
                        {CUSTOMER_STATUS_LABELS[customer.status]}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted">{customer.email}</p>
                    <p className="mt-1 text-xs text-muted">
                      {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'} · {open} active · {last ? formatRelative(last, now) : 'No tickets yet'}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
            {rows.length === 0 && <li className="px-5 py-10 text-sm text-muted">No customers match this search.</li>}
          </ul>
        </section>

        <div className={`${customerId ? 'flex' : 'hidden xl:flex'} min-h-0 min-w-0 flex-1 flex-col overflow-y-auto`}>
          {selected ? (
            <CustomerDetail customer={selected} tickets={data.tickets.filter((t) => t.customerId === selected.id)} now={now} timeZone={data.settings.timezone} />
          ) : customerId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <p className="text-sm font-semibold">Customer not found</p>
              <Link to="/customers" className="text-sm font-medium text-accent hover:underline">
                Back to customers
              </Link>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <p className="text-sm font-semibold">Select a customer</p>
              <p className="text-sm text-muted">See contact details, ticket history and orders in one place.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerDetail({ customer, tickets, now, timeZone }: { customer: Customer; tickets: Ticket[]; now: Date; timeZone: string }) {
  const customerOrders = orders.filter((o) => o.customerId === customer.id);
  const openCount = tickets.filter(isActive).length;
  const lifetime = customerOrders.filter((o) => o.status !== 'refunded').reduce((sum, o) => sum + o.total, 0);
  const history = [...tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <article className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start gap-4">
        <Avatar name={customer.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{customer.name}</h2>
            <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${CUSTOMER_STATUS_STYLE[customer.status]}`}>
              {CUSTOMER_STATUS_LABELS[customer.status]}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted">Email</dt>
              <dd><a href={`mailto:${customer.email}`} className="text-accent hover:underline">{customer.email}</a></dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Phone</dt>
              <dd>{customer.phone}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">City</dt>
              <dd>{customer.city}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Customer since</dt>
              <dd>{new Date(customer.customerSince).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</dd>
            </div>
          </dl>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total tickets', value: tickets.length },
          { label: 'Active tickets', value: openCount },
          { label: 'Orders', value: customerOrders.length },
          { label: 'Order value', value: `$${lifetime.toFixed(2)}` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-panel p-4">
            <dt className="text-xs text-muted">{stat.label}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="history-title" className="rounded-2xl border border-line bg-panel">
        <h3 id="history-title" className="border-b border-line px-5 py-3 text-sm font-semibold">Ticket history</h3>
        {history.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">This customer has no tickets yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {history.map((ticket) => (
              <li key={ticket.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <Link to={`/tickets/${ticket.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-accent">
                  <span className="text-muted">{ticket.id}</span> · {ticket.subject}
                </Link>
                <StatusBadge status={ticket.status} />
                <span className="text-xs text-muted">{formatRelative(ticket.updatedAt, now)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="conversations-title" className="rounded-2xl border border-line bg-panel">
        <h3 id="conversations-title" className="border-b border-line px-5 py-3 text-sm font-semibold">Recent conversations</h3>
        {history.filter((t) => t.messages.length > 0).length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">No messages yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {history
              .filter((t) => t.messages.length > 0)
              .slice(0, 3)
              .map((ticket) => {
                const last = ticket.messages[ticket.messages.length - 1];
                return (
                  <li key={ticket.id} className="px-5 py-3">
                    <Link to={`/tickets/${ticket.id}`} className="text-sm font-medium hover:text-accent">
                      {ticket.subject}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {last.author === 'agent' ? 'Agent: ' : 'Customer: '}
                      {last.body}
                    </p>
                    <p className="mt-1 text-xs text-subtle">{formatDateTime(last.createdAt, timeZone)}</p>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      <section aria-labelledby="orders-title" className="rounded-2xl border border-line bg-panel">
        <h3 id="orders-title" className="border-b border-line px-5 py-3 text-sm font-semibold">Orders</h3>
        {customerOrders.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">No orders on record.</p>
        ) : (
          <ul className="divide-y divide-line">
            {customerOrders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <span className="font-medium">{order.id}</span>
                <span className="text-muted">{order.items.map((item) => `${item.quantity} × ${item.name}`).join(', ')}</span>
                <span className="ml-auto"><OrderStatusBadge status={order.status} /></span>
                <span className="font-medium tabular-nums">${order.total.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
