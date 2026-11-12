import { createPrng, int, pick } from './prng';
import type {
  Campaign,
  CampaignStatus,
  Channel,
  CmsBlock,
  Customer,
  Journey,
  Plan,
  Template,
  User,
} from './types';

/**
 * Seeded fixture data. Generated once at module load with a fixed seed, so
 * `campaigns[7]` is the same record in every test run and in the dev server.
 * Milestone tests may rely on the counts below but should not hard-code
 * individual generated values — derive expectations from the arrays.
 */

export const USERS: User[] = [
  { id: 'u1', name: 'Maya Lindqvist', role: 'editor' },
  { id: 'u2', name: 'Tomás Ribeiro', role: 'approver' },
  { id: 'u3', name: 'Priya Natarajan', role: 'editor' },
];

const STATUSES: CampaignStatus[] = [
  'draft',
  'draft',
  'pending_approval',
  'pending_approval',
  'scheduled',
  'running',
  'paused',
  'completed',
  'completed',
];
const CHANNELS: Channel[] = ['email', 'email', 'sms', 'push'];
const ADJECTIVES = [
  'Spring',
  'Loyalty',
  'Win-back',
  'Launch',
  'Flash',
  'VIP',
  'Holiday',
  'Referral',
  'Onboarding',
  'Upgrade',
];
const NOUNS = [
  'Sale',
  'Reminder',
  'Teaser',
  'Digest',
  'Nudge',
  'Announcement',
  'Offer',
  'Survey',
];

const EPOCH = Date.UTC(2026, 0, 5); // 2026-01-05T00:00:00Z

function isoDaysFrom(base: number, days: number, minutes = 0): string {
  return new Date(base + days * 86_400_000 + minutes * 60_000).toISOString();
}

function buildCampaigns(): Campaign[] {
  const rng = createPrng(1101);
  const out: Campaign[] = [];
  for (let i = 0; i < 40; i++) {
    const status = pick(rng, STATUSES);
    const createdDay = int(rng, 0, 120);
    const updatedDay = createdDay + int(rng, 0, 40);
    const sent =
      status === 'draft' ||
      status === 'pending_approval' ||
      status === 'scheduled'
        ? 0
        : int(rng, 200, 25_000);
    out.push({
      id: `c${String(i + 1).padStart(2, '0')}`,
      name: `${pick(rng, ADJECTIVES)} ${pick(rng, NOUNS)} ${i + 1}`,
      status,
      channel: pick(rng, CHANNELS),
      ownerId: pick(rng, USERS).id,
      audienceId: rng() < 0.8 ? `seg${int(rng, 1, 6)}` : null,
      templateId: rng() < 0.85 ? `t${int(rng, 1, 6)}` : null,
      journeyId: rng() < 0.3 ? pick(rng, ['j1', 'j2']) : null,
      budgetCents: int(rng, 5, 400) * 10_000,
      sentCount: sent,
      openRate: sent === 0 ? 0 : Math.round(rng() * 60) / 100,
      createdAt: isoDaysFrom(EPOCH, createdDay, int(rng, 0, 1439)),
      updatedAt: isoDaysFrom(EPOCH, updatedDay, int(rng, 0, 1439)),
    });
  }
  return out;
}

const FIRST = [
  'Ava',
  'Liam',
  'Noor',
  'Mateo',
  'Sofia',
  'Kenji',
  'Amara',
  'Lucas',
  'Ines',
  'Omar',
  'Hana',
  'Felix',
];
const LAST = [
  'Okafor',
  'Brandt',
  'Silva',
  'Tanaka',
  'Haddad',
  'Novak',
  'Rossi',
  'Dubois',
  'Chen',
  'Walsh',
];
const COUNTRIES = ['US', 'US', 'US', 'GB', 'DE', 'FR', 'BR', 'IN', 'JP', 'CA'];
const PLANS: Plan[] = ['free', 'free', 'free', 'pro', 'pro', 'enterprise'];
const TAGS = [
  'newsletter',
  'beta',
  'churn-risk',
  'vip',
  'mobile',
  'trial',
  'partner',
];

function buildCustomers(): Customer[] {
  const rng = createPrng(2202);
  const out: Customer[] = [];
  for (let i = 0; i < 60; i++) {
    const first = pick(rng, FIRST);
    const last = pick(rng, LAST);
    const tagCount = int(rng, 0, 3);
    const tags = Array.from(
      new Set(Array.from({ length: tagCount }, () => pick(rng, TAGS))),
    ).sort();
    const bought = rng() < 0.75;
    out.push({
      id: `cust${String(i + 1).padStart(3, '0')}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${i + 1}@example.com`.toLowerCase(),
      plan: pick(rng, PLANS),
      country: pick(rng, COUNTRIES),
      age: int(rng, 18, 72),
      tags,
      lastPurchaseAt: bought
        ? isoDaysFrom(EPOCH, -int(rng, 0, 400), int(rng, 0, 1439))
        : null,
    });
  }
  return out;
}

export const campaigns: Campaign[] = buildCampaigns();
export const customers: Customer[] = buildCustomers();

export const templates: Template[] = [
  {
    id: 't1',
    name: 'Welcome email',
    channel: 'email',
    subject: 'Welcome aboard, {{first_name | friend}}!',
    body: '{{block:header}}\nHi {{first_name | there}},\n\nThanks for joining on the {{plan}} plan.\n\n{{block:footer}}',
    updatedAt: isoDaysFrom(EPOCH, 3),
  },
  {
    id: 't2',
    name: 'Flash sale SMS',
    channel: 'sms',
    body: '{{first_name | Hey}}: 20% off everything until midnight. {{block:unsubscribe}}',
    updatedAt: isoDaysFrom(EPOCH, 10),
  },
  {
    id: 't3',
    name: 'Win-back offer',
    channel: 'email',
    subject: 'We miss you, {{first_name}}',
    body: '{{block:header}}\nIt has been a while since {{last_purchase_date | your last visit}}.\n{{block:promo_banner}}\n{{block:footer}}',
    updatedAt: isoDaysFrom(EPOCH, 15),
  },
  {
    id: 't4',
    name: 'Push: cart reminder',
    channel: 'push',
    body: 'Your cart is waiting, {{first_name | friend}} — {{cart_count | a few}} items inside.',
    updatedAt: isoDaysFrom(EPOCH, 20),
  },
  {
    id: 't5',
    name: 'Legal notice',
    channel: 'email',
    subject: 'Updates to our terms',
    body: 'Dear {{first_name | customer}},\n\n{{block:legal}}\n\nUse \\{{ literal braces }} to show braces.\n{{block:footer}}',
    updatedAt: isoDaysFrom(EPOCH, 25),
  },
  {
    id: 't6',
    name: 'Broken template',
    channel: 'email',
    subject: 'Oops',
    body: 'Hello {{first_name, this one never closes and {{block:missing}} points nowhere.',
    updatedAt: isoDaysFrom(EPOCH, 30),
  },
];

export const blocks: CmsBlock[] = [
  { id: 'header', name: 'Header', content: '=== Campaign Studio ===' },
  {
    id: 'footer',
    name: 'Footer',
    content: 'Sent by {{brand | Campaign Studio}}. {{block:unsubscribe}}',
  },
  {
    id: 'promo_banner',
    name: 'Promo banner',
    content: '*** Use code {{promo_code | COMEBACK10}} for 10% off ***',
  },
  {
    id: 'unsubscribe',
    name: 'Unsubscribe',
    content: 'Reply STOP to unsubscribe.',
  },
  {
    id: 'legal',
    name: 'Legal',
    content:
      'This message is provided for information only and is not a contract.',
  },
];

export const journeys: Journey[] = [
  {
    id: 'j1',
    name: 'Welcome series',
    nodes: [
      { id: 'start', type: 'entry', label: 'Signed up' },
      {
        id: 'welcome',
        type: 'send',
        label: 'Send welcome email',
        config: { templateId: 't1' },
      },
      {
        id: 'wait2d',
        type: 'wait',
        label: 'Wait 2 days',
        config: { hours: 48 },
      },
      { id: 'opened', type: 'branch', label: 'Opened welcome?' },
      {
        id: 'offer',
        type: 'send',
        label: 'Send offer',
        config: { templateId: 't3' },
      },
      {
        id: 'nudge',
        type: 'send',
        label: 'Send push nudge',
        config: { templateId: 't4' },
      },
      { id: 'done', type: 'exit', label: 'Done' },
    ],
    edges: [
      { from: 'start', to: 'welcome' },
      { from: 'welcome', to: 'wait2d' },
      { from: 'wait2d', to: 'opened' },
      { from: 'opened', to: 'offer', label: 'yes' },
      { from: 'opened', to: 'nudge', label: 'no' },
      { from: 'offer', to: 'done' },
      { from: 'nudge', to: 'done' },
    ],
    updatedAt: isoDaysFrom(EPOCH, 12),
  },
  {
    id: 'j2',
    name: 'Win-back (needs attention)',
    nodes: [
      { id: 'start', type: 'entry', label: 'Inactive 90 days' },
      {
        id: 'offer',
        type: 'send',
        label: 'Send win-back offer',
        config: { templateId: 't3' },
      },
      {
        id: 'wait',
        type: 'wait',
        label: 'Wait 7 days',
        config: { hours: 168 },
      },
      { id: 'bought', type: 'branch', label: 'Purchased?' },
      {
        id: 'legacy_sms',
        type: 'send',
        label: 'Legacy SMS (unreachable)',
        config: { templateId: 't2' },
      },
      { id: 'done', type: 'exit', label: 'Done' },
    ],
    edges: [
      { from: 'start', to: 'offer' },
      { from: 'offer', to: 'wait' },
      { from: 'wait', to: 'bought' },
      { from: 'bought', to: 'done', label: 'yes' },
      { from: 'bought', to: 'offer', label: 'no' },
    ],
    updatedAt: isoDaysFrom(EPOCH, 18),
  },
];
