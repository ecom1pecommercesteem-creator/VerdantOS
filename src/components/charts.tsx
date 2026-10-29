import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DayPoint } from '../lib/metrics';
import { stagger } from './motion';

// Plain CSS bars keep the charts dependency-free and readable in both screenshots and the live app.

interface StatCardProps {
  label: string;
  value: string;
  detail: string;
  icon?: LucideIcon;
  tone?: 'default' | 'hero';
  index?: number;
  to?: string; // where the value leads, e.g. the tickets it counts
  detailTo?: string; // where the detail line leads, when it counts something else
}

const LINK = 'rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current';

export function StatCard({ label, value, detail, icon: Icon, tone = 'default', index = 0, to, detailTo }: StatCardProps) {
  const hero = tone === 'hero';
  const secondary = hero ? 'text-white' : 'text-muted';
  return (
    <div style={stagger(index)} className={`enter flex items-center gap-4 rounded-3xl p-5 ${hero ? 'bg-gradient-to-br from-[#56755f] to-accent text-white' : 'bg-panel'}`}>
      {Icon && (
        <span className={`flex size-14 shrink-0 items-center justify-center rounded-full ${hero ? 'bg-white/20' : 'bg-accent-soft text-accent'}`}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <p className={`text-sm ${secondary}`}>{label}</p>
        <p className="mt-0.5 text-3xl font-semibold tabular-nums">
          {to ? <Link to={to} className={LINK}>{value}</Link> : value}
        </p>
        <p className={`mt-0.5 text-xs ${secondary}`}>
          {detailTo ? <Link to={detailTo} className={`${LINK} underline-offset-2`}>{detail}</Link> : detail}
        </p>
      </div>
    </div>
  );
}

export function BarRow({ label, value, max, tone = 'bg-accent' }: { label: string; value: number; max: number; tone?: string }) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate text-body">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
        <div className={`grow-x h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </li>
  );
}

// Bars take at most 80% of the plot height so the count printed above the tallest one still fits.
const BAR_SPACE = 80;

export function VolumeChart({ points }: { points: DayPoint[] }) {
  const max = Math.max(1, ...points.flatMap((p) => [p.created, p.resolved]));
  const bar = (count: number, tone: string, label: string) => (
    <div className="flex h-full w-1/2 max-w-5 flex-col items-center justify-end" title={label}>
      <span className="text-[10px] leading-4 tabular-nums text-body">{count}</span>
      <span className={`grow-y w-full max-w-4 rounded-t-md ${tone}`} style={{ height: `${(count / max) * BAR_SPACE}%` }} />
    </div>
  );
  return (
    <figure aria-label="Tickets created and resolved per day">
      <div className="flex items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-accent" aria-hidden="true" /> Created
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-sage" aria-hidden="true" /> Resolved
        </span>
      </div>
      <div className="mt-4 flex h-44 items-end gap-2 sm:gap-3" aria-hidden="true">
        {points.map((point) => (
          <div key={point.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <div className="flex h-full w-full items-end justify-center gap-1">
              {bar(point.created, 'bg-accent', `${point.label}: ${point.created} created`)}
              {bar(point.resolved, 'bg-sage', `${point.label}: ${point.resolved} resolved`)}
            </div>
            <span className="text-[11px] text-muted sm:text-xs">{point.label}</span>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>Tickets created and resolved per day</caption>
        <thead>
          <tr><th scope="col">Day</th><th scope="col">Created</th><th scope="col">Resolved</th></tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.label}><th scope="row">{point.label}</th><td>{point.created}</td><td>{point.resolved}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
