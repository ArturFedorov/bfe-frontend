/** Shared domain types for Campaign Studio. Every milestone imports from here. */

export type Role = 'editor' | 'approver';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export type Channel = 'email' | 'sms' | 'push';

export type CampaignStatus =
  | 'draft'
  | 'pending_approval'
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'completed';

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  channel: Channel;
  ownerId: string;
  /** Segment this campaign targets; null while still being drafted. */
  audienceId: string | null;
  templateId: string | null;
  journeyId: string | null;
  budgetCents: number;
  sentCount: number;
  /** 0..1, only meaningful once something was sent. */
  openRate: number;
  createdAt: string;
  updatedAt: string;
}

export type Plan = 'free' | 'pro' | 'enterprise';

export interface Customer {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  /** ISO 3166-1 alpha-2, upper case. */
  country: string;
  age: number;
  tags: string[];
  /** ISO instant, or null when the customer never bought anything. */
  lastPurchaseAt: string | null;
}

export interface Template {
  id: string;
  name: string;
  channel: Channel;
  /** Email only. */
  subject?: string;
  body: string;
  updatedAt: string;
}

/** Reusable CMS snippet referenced from templates as `{{block:id}}`. */
export interface CmsBlock {
  id: string;
  name: string;
  content: string;
}

export type JourneyNodeType = 'entry' | 'send' | 'wait' | 'branch' | 'exit';

export interface JourneyNode {
  id: string;
  type: JourneyNodeType;
  label: string;
  /** Node-specific settings: templateId for `send`, hours for `wait`, rule for `branch`. */
  config?: Record<string, unknown>;
}

export interface JourneyEdge {
  from: string;
  to: string;
  /** Branch outcome label, e.g. `yes` / `no`. */
  label?: string;
}

export interface Journey {
  id: string;
  name: string;
  nodes: JourneyNode[];
  edges: JourneyEdge[];
  updatedAt: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type SortDir = 'asc' | 'desc';

export type CampaignSortField =
  | 'name'
  | 'updatedAt'
  | 'budgetCents'
  | 'sentCount';

export interface CampaignSort {
  field: CampaignSortField;
  dir: SortDir;
}
