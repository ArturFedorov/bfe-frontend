import * as fixtures from './fixtures';
import { createPrng } from './prng';
import type {
  Campaign,
  CampaignSort,
  CampaignStatus,
  CmsBlock,
  Customer,
  Journey,
  Page,
  Template,
} from './types';

/**
 * In-memory fake backend. Every method returns a promise that settles after
 * `latencyMs` and, with probability `failureRate`, rejects with an
 * `ApiError('NETWORK')`. Both knobs are injectable, and the failure draw comes
 * from a seeded PRNG, so a test that sets `{ failureRate: 0.5, seed: 7 }` sees
 * the same pass/fail sequence every run.
 *
 * Responses are deep clones: mutating what you got back never changes the
 * store, exactly like JSON over the wire.
 */

export type ApiErrorCode = 'NETWORK' | 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN';

export class ApiError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export interface ApiOptions {
  /** Delay before each response settles. Default 0 (still async: resolves on a timer). */
  latencyMs?: number;
  /** 0..1 probability that a call rejects with `ApiError('NETWORK')`. Default 0. */
  failureRate?: number;
  /** Seed for the failure draw. Default 42. */
  seed?: number;
}

export interface ListCampaignsParams {
  /** 1-based. Default 1. */
  page?: number;
  /** Default 10. */
  pageSize?: number;
  /** Omit or `'all'` for every status. */
  status?: CampaignStatus | 'all';
  /** Default `{ field: 'updatedAt', dir: 'desc' }`. */
  sort?: CampaignSort;
}

export type CampaignPatch = Partial<
  Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>
>;

export type ApiMethod =
  | 'listCampaigns'
  | 'getCampaign'
  | 'updateCampaign'
  | 'approveCampaigns'
  | 'listCustomers'
  | 'listTemplates'
  | 'saveTemplate'
  | 'listBlocks'
  | 'getJourney'
  | 'saveJourney';

export interface Api {
  listCampaigns(params?: ListCampaignsParams): Promise<Page<Campaign>>;
  getCampaign(id: string): Promise<Campaign>;
  updateCampaign(id: string, patch: CampaignPatch): Promise<Campaign>;
  /** Moves `pending_approval` campaigns to `scheduled`. Rejects with CONFLICT if any is not pending. */
  approveCampaigns(ids: string[]): Promise<Campaign[]>;
  listCustomers(): Promise<Customer[]>;
  listTemplates(): Promise<Template[]>;
  /** Upserts by id and stamps `updatedAt`. */
  saveTemplate(template: Template): Promise<Template>;
  listBlocks(): Promise<CmsBlock[]>;
  getJourney(id: string): Promise<Journey>;
  /** Upserts by id and stamps `updatedAt`. */
  saveJourney(journey: Journey): Promise<Journey>;

  /** Test hooks. */
  setOptions(options: ApiOptions): void;
  /** Restore fixtures and reset the call counters and the PRNG. */
  reset(): void;
  /** How many times each method was invoked since the last reset. */
  readonly calls: Readonly<Record<ApiMethod, number>>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function emptyCalls(): Record<ApiMethod, number> {
  return {
    listCampaigns: 0,
    getCampaign: 0,
    updateCampaign: 0,
    approveCampaigns: 0,
    listCustomers: 0,
    listTemplates: 0,
    saveTemplate: 0,
    listBlocks: 0,
    getJourney: 0,
    saveJourney: 0,
  };
}

function compareCampaigns(
  sort: CampaignSort,
): (a: Campaign, b: Campaign) => number {
  const sign = sort.dir === 'asc' ? 1 : -1;
  return (a, b) => {
    const av = a[sort.field];
    const bv = b[sort.field];
    if (av === bv) return a.id < b.id ? -1 : 1; // stable tiebreak
    if (typeof av === 'string' && typeof bv === 'string')
      return sign * av.localeCompare(bv);
    return sign * ((av as number) < (bv as number) ? -1 : 1);
  };
}

export function createApi(initial: ApiOptions = {}): Api {
  let latencyMs = initial.latencyMs ?? 0;
  let failureRate = initial.failureRate ?? 0;
  let seed = initial.seed ?? 42;
  let rng = createPrng(seed);
  const calls = emptyCalls();

  let campaigns: Campaign[] = clone(fixtures.campaigns);
  let templates: Template[] = clone(fixtures.templates);
  let journeys: Journey[] = clone(fixtures.journeys);
  const customers: Customer[] = clone(fixtures.customers);
  const blocks: CmsBlock[] = clone(fixtures.blocks);

  /**
   * The failure draw happens synchronously at call time, so the pass/fail
   * sequence depends only on call order — never on timer interleaving.
   */
  function respond<T>(method: ApiMethod, produce: () => T): Promise<T> {
    calls[method] += 1;
    const fails = failureRate > 0 && rng() < failureRate;
    return new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        if (fails) {
          reject(new ApiError('NETWORK', `${method} failed: network error`));
          return;
        }
        try {
          resolve(clone(produce()));
        } catch (error) {
          reject(error);
        }
      }, latencyMs);
    });
  }

  function findCampaign(id: string): Campaign {
    const found = campaigns.find((c) => c.id === id);
    if (!found) throw new ApiError('NOT_FOUND', `Campaign ${id} not found`);
    return found;
  }

  return {
    listCampaigns(params = {}) {
      return respond('listCampaigns', () => {
        const page = Math.max(1, params.page ?? 1);
        const pageSize = Math.max(1, params.pageSize ?? 10);
        const status = params.status ?? 'all';
        const sort = params.sort ?? { field: 'updatedAt', dir: 'desc' };
        const filtered =
          status === 'all'
            ? campaigns.slice()
            : campaigns.filter((c) => c.status === status);
        filtered.sort(compareCampaigns(sort));
        const start = (page - 1) * pageSize;
        return {
          items: filtered.slice(start, start + pageSize),
          total: filtered.length,
          page,
          pageSize,
        };
      });
    },
    getCampaign(id) {
      return respond('getCampaign', () => findCampaign(id));
    },
    updateCampaign(id, patch) {
      return respond('updateCampaign', () => {
        const current = findCampaign(id);
        const next: Campaign = {
          ...current,
          ...patch,
          id,
          updatedAt: new Date().toISOString(),
        };
        campaigns = campaigns.map((c) => (c.id === id ? next : c));
        return next;
      });
    },
    approveCampaigns(ids) {
      return respond('approveCampaigns', () => {
        const targets = ids.map(findCampaign);
        const notPending = targets.filter(
          (c) => c.status !== 'pending_approval',
        );
        if (notPending.length > 0) {
          throw new ApiError(
            'CONFLICT',
            `Cannot approve ${notPending.map((c) => c.id).join(', ')}: not pending approval`,
          );
        }
        const now = new Date().toISOString();
        const approved = targets.map((c) => ({
          ...c,
          status: 'scheduled' as const,
          updatedAt: now,
        }));
        const byId = new Map(approved.map((c) => [c.id, c]));
        campaigns = campaigns.map((c) => byId.get(c.id) ?? c);
        return approved;
      });
    },
    listCustomers() {
      return respond('listCustomers', () => customers);
    },
    listTemplates() {
      return respond('listTemplates', () => templates);
    },
    saveTemplate(template) {
      return respond('saveTemplate', () => {
        const next = { ...template, updatedAt: new Date().toISOString() };
        const exists = templates.some((t) => t.id === next.id);
        templates = exists
          ? templates.map((t) => (t.id === next.id ? next : t))
          : [...templates, next];
        return next;
      });
    },
    listBlocks() {
      return respond('listBlocks', () => blocks);
    },
    getJourney(id) {
      return respond('getJourney', () => {
        const found = journeys.find((j) => j.id === id);
        if (!found) throw new ApiError('NOT_FOUND', `Journey ${id} not found`);
        return found;
      });
    },
    saveJourney(journey) {
      return respond('saveJourney', () => {
        const next = { ...journey, updatedAt: new Date().toISOString() };
        const exists = journeys.some((j) => j.id === next.id);
        journeys = exists
          ? journeys.map((j) => (j.id === next.id ? next : j))
          : [...journeys, next];
        return next;
      });
    },

    setOptions(options) {
      if (options.latencyMs !== undefined) latencyMs = options.latencyMs;
      if (options.failureRate !== undefined) failureRate = options.failureRate;
      if (options.seed !== undefined) {
        seed = options.seed;
        rng = createPrng(seed);
      }
    },
    reset() {
      campaigns = clone(fixtures.campaigns);
      templates = clone(fixtures.templates);
      journeys = clone(fixtures.journeys);
      rng = createPrng(seed);
      for (const key of Object.keys(calls) as ApiMethod[]) calls[key] = 0;
    },
    calls,
  };
}

/** The instance the running app uses. Tests should create their own with `createApi`. */
export const api: Api = createApi({ latencyMs: 350 });
