import type { Agent, EscalationStatus } from '../types';

export const ESCALATION_STATUS_LABELS: Record<EscalationStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  fixed: 'Fixed',
};

export const ESCALATION_STATUS_ORDER: EscalationStatus[] = ['open', 'in_progress', 'fixed'];

export const isDeveloper = (agent: Agent): boolean => agent.role === 'Developer';
