import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { avatarHue, initials } from '../lib/format';
import { PRIORITY_LABELS, STATUS_LABELS } from '../lib/ticket';
import type { OrderStatus, TicketPriority, TicketStatus } from '../types';
import { STATUS_STYLES } from './statusStyles';

// Shared look for text inputs, and for dashboard-style cards and their titles.
export const FIELD_CLASS =
  'rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent aria-[invalid=true]:border-red-400';
export const CARD = 'enter rounded-3xl bg-panel p-6';
export const CARD_TITLE = 'text-base font-semibold';

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const hue = avatarHue(name);
  const dimension = size === 'sm' ? 'size-7 text-[11px]' : 'size-9 text-xs';
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${dimension}`}
      style={{ background: `hsl(${hue} 70% 93%)`, color: `hsl(${hue} 45% 32%)` }}
    >
      {initials(name)}
    </span>
  );
}

export function Badge({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <Badge className={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>;
}

const ORDER_STYLES: Record<OrderStatus, string> = {
  processing: 'bg-slate-50 text-slate-700 ring-slate-200',
  shipped: 'bg-sky-50 text-sky-700 ring-sky-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  delayed: 'bg-amber-50 text-amber-800 ring-amber-300',
  refunded: 'bg-violet-50 text-violet-700 ring-violet-200',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={ORDER_STYLES[status]}>{status[0].toUpperCase() + status.slice(1)}</Badge>;
}

const PRIORITY_DOT: Record<TicketPriority, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-400',
  low: 'bg-slate-300',
};

export function PriorityLabel({ priority }: { priority: TicketPriority }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-body">
      <span className={`size-2 rounded-full ${PRIORITY_DOT[priority]}`} aria-hidden="true" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

type ButtonVariant = 'primary' | 'outline';

export function Button({
  variant = 'outline',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50';
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-white hover:bg-accent-hover',
    outline: 'border border-line bg-panel text-ink hover:bg-canvas',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
}

export function SelectField({ label, children, className = '', ...props }: SelectFieldProps) {
  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">{label}</span>
      <select
        name={label.toLowerCase().replace(/\s+/g, '-')}
        className="w-full cursor-pointer appearance-none rounded-xl border border-line bg-panel py-2 pr-8 pl-3 text-sm font-medium text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-accent"
        {...props}
      >
        {children}
      </select>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="pointer-events-none absolute right-3 size-3.5 text-muted">
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}

interface FilterTabsProps<T extends string> {
  label: string;
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'underline' | 'pill';
}

// A row of toggle buttons that filters a list. Each button reports pressed or not, so no tab panels are implied.
export function FilterTabs<T extends string>({ label, options, value, onChange, variant = 'underline' }: FilterTabsProps<T>) {
  const underline = variant === 'underline';
  return (
    <div
      role="group"
      aria-label={label}
      className={underline ? 'mt-4 flex gap-4 overflow-x-auto border-b border-line px-5 [scrollbar-width:none]' : 'flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-panel p-1'}
    >
      {options.map((option) => {
        const selected = value === option.value;
        const style = underline
          ? `-mb-px flex shrink-0 items-center gap-1.5 border-b-2 pb-3 ${selected ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink'}`
          : `shrink-0 rounded-lg px-3 py-1.5 ${selected ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink'}`;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${style}`}
          >
            {option.label}
            {option.count !== undefined && <span className={underline ? 'text-xs tabular-nums text-subtle' : 'ml-1 text-xs tabular-nums'}>{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
