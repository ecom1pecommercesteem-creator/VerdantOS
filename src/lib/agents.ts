import type { AgentAvailability } from '../types';

export const AVAILABILITY_LABELS: Record<AgentAvailability, string> = {
  online: 'Online',
  away: 'Away',
  offline: 'Offline',
};
