export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'paused'
  | 'archived';

interface EventBase {
  /** Globally unique id; used for idempotency. */
  eventId: string;
  /** Monotonically increasing log position for this campaign, starting at 1. */
  seq: number;
}

export type CampaignEvent = EventBase &
  (
    | { type: 'created'; name: string }
    | { type: 'renamed'; name: string }
    | { type: 'audience_set'; segmentId: string }
    | { type: 'scheduled'; startAt: string }
    | { type: 'sent'; count: number }
    | { type: 'paused' }
    | { type: 'resumed' }
    | { type: 'archived' }
  );

export interface CampaignState {
  exists: boolean;
  name: string;
  segmentId: string | null;
  startAt: string | null;
  status: CampaignStatus;
  sentCount: number;
  /** Highest seq consumed so far; 0 before any event. */
  lastSeq: number;
  /** The most recent consumed event ids (oldest first), at most 1000. */
  seenEventIds: string[];
}

export interface Snapshot {
  version: 1;
  state: CampaignState;
}

/** Maximum number of ids retained in `seenEventIds`. */
export const SEEN_IDS_LIMIT = 1000;

export const initialState: CampaignState = Object.freeze({
  exists: false,
  name: '',
  segmentId: null,
  startAt: null,
  status: 'draft',
  sentCount: 0,
  lastSeq: 0,
  seenEventIds: [],
}) as CampaignState;

/**
 * Pure reducer. Duplicate eventId or stale seq -> returns `state` itself.
 * Otherwise consumes the event (lastSeq, seenEventIds) and applies the
 * transition if the table allows it; nothing after `archived` has an effect.
 */
export function apply(
  state: CampaignState,
  event: CampaignEvent,
): CampaignState {
  // TODO: implement
  throw new Error('Not implemented');
}

/** Folds `apply` over `events` starting from `initialState`. */
export function rebuild(events: CampaignEvent[]): CampaignState {
  // TODO: implement
  throw new Error('Not implemented');
}

/** Detached deep copy of `state`, safe to serialise. */
export function snapshot(state: CampaignState): Snapshot {
  // TODO: implement
  throw new Error('Not implemented');
}

/** Resumes folding from `snap`; equals `rebuild(all)` for any split point. */
export function rebuildFrom(
  snap: Snapshot,
  eventsAfter: CampaignEvent[],
): CampaignState {
  // TODO: implement
  throw new Error('Not implemented');
}
