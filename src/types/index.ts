
export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory =
  | 'order_shipping'
  | 'returns_refunds'
  | 'payments'
  | 'product_questions'
  | 'account'
  | 'other';

export type AgentAvailability = 'online' | 'away' | 'offline';
export type CustomerStatus = 'vip' | 'active' | 'at_risk';
export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'delayed' | 'refunded';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  status: CustomerStatus;
  customerSince: string; // ISO date
}

export interface Agent {
  id: string;
  name: string;
  role: 'Support Lead' | 'Support Agent' | 'Developer';
  availability: AgentAvailability;
  email: string;
  passwordHash: string; // SHA-256 hex, see lib/password.ts
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  placedAt: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  carrier?: string;
  trackingNumber?: string;
}

export interface Message {
  id: string;
  ticketId: string;
  author: 'customer' | 'agent';
  agentId?: string;
  body: string;
  createdAt: string;
}

export interface InternalNote {
  id: string;
  ticketId: string;
  agentId: string;
  body: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  ticketId: string;
  actorId: string | null; // null = system or customer
  text: string;
  createdAt: string;
}

export interface Ticket {
  id: string; // e.g. "TKT-1042"
  subject: string;
  customerId: string;
  orderId?: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  reopenedAt?: string | null; // restarts the reply deadline when a resolved ticket is reopened
  csat: number | null; // 1-5, set once resolved
  messages: Message[];
  notes: InternalNote[];
  activity: ActivityEvent[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  ticketId?: string;
  recipientId?: string; // only this agent sees it; omitted = everyone
}

export interface WorkspaceSettings {
  workspaceName: string;
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  timezone: string;
  workingHoursStart: string; // "HH:MM"
  workingHoursEnd: string;
  notifyNewTicket: boolean;
  notifyCustomerReply: boolean;
  notifySlaBreach: boolean;
  notifyDailyDigest: boolean;
}

export type EscalationStatus = 'open' | 'in_progress' | 'fixed';

// A customer-reported problem that support hands to the developers. One ticket can have several.
export interface Escalation {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  severity: TicketPriority;
  status: EscalationStatus;
  assigneeId: string | null; // always a developer
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  tickets: Ticket[];
  escalations: Escalation[];
  agents: Agent[];
  notifications: NotificationItem[];
  settings: WorkspaceSettings;
  seededAt: string; // when the demo data was generated; its timestamps are relative to this
}
