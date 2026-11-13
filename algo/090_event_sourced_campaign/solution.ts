/**
 * 090. Event-Sourced Campaign — reference solution
 *
 * apply(state, event) — a pure reducer with three guards, in this order:
 *   1. Duplicate: `eventId` is in `seenEventIds`      → return `state` (same ref)
 *   2. Stale:     `seq <= lastSeq` with an unseen id   → return `state` (same ref)
 *   3. Consume:   `lastSeq = seq`, append the id (window of the last 1000),
 *                 then apply the state-machine transition if allowed.
 *   A consumed event ALWAYS yields a new object, even when the transition is
 *   a no-op (not created yet, illegal transition, or after `archived`), so
 *   callers can use `===` as a "was anything ingested?" check and still tell
 *   that apart from "ignored".
 *
 *   The id window can be bounded because seq is strictly increasing: any
 *   event older than the 1000 most recent ones has `seq <= lastSeq` and is
 *   rejected by guard 2 even though its id has scrolled out of the window.
 *   (The `includes` scan over <= 1000 ids keeps the state a plain, JSON-safe
 *   object; a Set alongside it would make guard 1 O(1) at the cost of a
 *   non-serialisable field or a parallel structure in the consumer.)
 *
 *   Transitions are expressed as a `Partial<CampaignState>` patch so the
 *   bookkeeping (lastSeq / seenEventIds) and the domain change are merged in
 *   one spread and `state` is never touched. `resumed` derives its target
 *   from `sentCount` (> 0 → 'sending', else 'scheduled') rather than a stored
 *   previous status, keeping the fold deterministic.
 *
 * rebuild(events)         — `events.reduce(apply, initialState)`.
 * snapshot(state)         — `{ version: 1, state }` with the only non-primitive
 *                           field (`seenEventIds`) copied, so it is detached.
 * rebuildFrom(snap, tail) — fold from a detached copy of the snapshot state.
 *   Because the guards are keyed on ids/seq already in the snapshot, a tail
 *   that overlaps the snapshotted events is harmlessly ignored, so snapshot +
 *   tail equals a full replay for every split point.
 *
 * Time: O(W) per event with W = 1000 (id scan + window copy) — O(1)
 * amortised constant; rebuild is O(n). Space: O(1) state + the id window.
 */

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

/** The domain effect of `event` on `state`, or `{}` when the table forbids it. */
function transition(
  state: CampaignState,
  event: CampaignEvent,
): Partial<CampaignState> {
  if (state.status === 'archived') return {}; // terminal

  if (!state.exists) {
    return event.type === 'created'
      ? { exists: true, name: event.name, status: 'draft' }
      : {};
  }

  const { status } = state;
  switch (event.type) {
    case 'created':
      return {}; // already exists
    case 'renamed':
      return { name: event.name };
    case 'audience_set':
      return { segmentId: event.segmentId };
    case 'scheduled':
      return status === 'draft' || status === 'scheduled'
        ? { startAt: event.startAt, status: 'scheduled' }
        : {};
    case 'sent':
      return status === 'scheduled' || status === 'sending'
        ? { sentCount: state.sentCount + event.count, status: 'sending' }
        : {};
    case 'paused':
      return status === 'scheduled' || status === 'sending'
        ? { status: 'paused' }
        : {};
    case 'resumed':
      return status === 'paused'
        ? { status: state.sentCount > 0 ? 'sending' : 'scheduled' }
        : {};
    case 'archived':
      return { status: 'archived' };
    default:
      return {};
  }
}

/** `ids` plus `id`, keeping only the most recent SEEN_IDS_LIMIT entries. */
function pushBounded(ids: string[], id: string): string[] {
  const keepFrom = Math.max(0, ids.length + 1 - SEEN_IDS_LIMIT);
  const next = ids.slice(keepFrom);
  next.push(id);
  return next;
}

/**
 * Pure reducer. Duplicate eventId or stale seq -> returns `state` itself.
 * Otherwise consumes the event (lastSeq, seenEventIds) and applies the
 * transition if the table allows it; nothing after `archived` has an effect.
 */
export function apply(
  state: CampaignState,
  event: CampaignEvent,
): CampaignState {
  // 1. Duplicate delivery (at-least-once consumer).
  if (state.seenEventIds.includes(event.eventId)) return state;
  // 2. Stale replay: already past this log position.
  if (event.seq <= state.lastSeq) return state;

  // 3. Consume: bookkeeping always, domain change only if the table allows.
  return {
    ...state,
    ...transition(state, event),
    lastSeq: event.seq,
    seenEventIds: pushBounded(state.seenEventIds, event.eventId),
  };
}

/** Folds `apply` over `events` starting from `initialState`. */
export function rebuild(events: CampaignEvent[]): CampaignState {
  return events.reduce(apply, initialState);
}

/** Detached deep copy of `state`, safe to serialise. */
export function snapshot(state: CampaignState): Snapshot {
  return {
    version: 1,
    state: { ...state, seenEventIds: [...state.seenEventIds] },
  };
}

/** Resumes folding from `snap`; equals `rebuild(all)` for any split point. */
export function rebuildFrom(
  snap: Snapshot,
  eventsAfter: CampaignEvent[],
): CampaignState {
  // Start from a detached copy so later mutation of `snap` cannot leak in.
  const start = snapshot(snap.state).state;
  return eventsAfter.reduce(apply, start);
}
