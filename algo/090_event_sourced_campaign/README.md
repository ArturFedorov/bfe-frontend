# 090. Event-Sourced Campaign

**Difficulty:** Medium
**Topics:** Event Sourcing, Reducers, Idempotency, State Machines, Snapshots

---

## Description

Campaigns in a marketing-automation platform are not stored as rows that get
updated; they are stored as an **append-only log of events** and the current
state is derived by folding the log. Workers consume the log at-least-once,
so the same event can arrive twice, out of order, or long after a worker
restarted from a snapshot. The fold must be a pure, deterministic reducer that
shrugs all of that off.

Every event carries `eventId: string` (globally unique) and `seq: number`
(the campaign's monotonically increasing log position, starting at 1):

| `type`         | payload                | effect                                                    |
| -------------- | ---------------------- | --------------------------------------------------------- |
| `created`      | `{ name }`             | `exists = true`, `name`, `status = 'draft'`               |
| `renamed`      | `{ name }`             | `name`                                                    |
| `audience_set` | `{ segmentId }`        | `segmentId`                                               |
| `scheduled`    | `{ startAt }`          | `startAt`, `status = 'scheduled'` (from draft/scheduled)  |
| `sent`         | `{ count }`            | `sentCount += count`, `status = 'sending'` (from scheduled/sending) |
| `paused`       | —                      | `status = 'paused'` (from scheduled/sending)              |
| `resumed`      | —                      | from paused → `'sending'` if `sentCount > 0`, else `'scheduled'` |
| `archived`     | —                      | `status = 'archived'` — terminal                          |

State:

```ts
{
  exists: boolean;
  name: string;
  segmentId: string | null;
  startAt: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'paused' | 'archived';
  sentCount: number;
  lastSeq: number;
  seenEventIds: string[];
}
```

Implement:

1. `initialState` — `exists: false`, empty name, nulls, `'draft'`, zeros,
   `[]`.
2. `apply(state, event)` — the reducer. Never mutates `state`. Rules, in order:
   - **Duplicate** (`eventId` already in `seenEventIds`): return `state`
     itself (**same reference**).
   - **Stale replay** (`seq <= lastSeq` with an unseen id): return `state`
     itself (**same reference**).
   - Otherwise the event is **consumed**: `lastSeq = seq` and `eventId` is
     appended to `seenEventIds`, **whether or not** it changes anything else.
   - After `archived`, every later event is consumed but has no other effect.
   - Any event other than `created` before the campaign exists, or a
     transition not allowed by the table (e.g. `resumed` while `draft`,
     `created` twice), is consumed but has no other effect.
   - `seenEventIds` keeps only the **last 1000** ids. This is safe because any
     duplicate older than that necessarily has `seq <= lastSeq` and is caught
     by the stale-replay rule.
3. `rebuild(events)` — fold `apply` over `events` starting from `initialState`.
4. `snapshot(state): Snapshot` — a detached deep copy
   (`{ version: 1, state }`), safe to serialise.
5. `rebuildFrom(snapshot, eventsAfter)` — resume folding from a snapshot.
   For any split point `k`, `rebuildFrom(snapshot(rebuild(all.slice(0, k))),
   all.slice(k))` must deep-equal `rebuild(all)` — including when
   `eventsAfter` overlaps events already in the snapshot.

## Examples

```ts
const events: CampaignEvent[] = [
  { eventId: 'e1', seq: 1, type: 'created', name: 'Spring Sale' },
  { eventId: 'e2', seq: 2, type: 'audience_set', segmentId: 'seg:vip' },
  { eventId: 'e3', seq: 3, type: 'scheduled', startAt: '2026-03-01T09:00:00Z' },
  { eventId: 'e4', seq: 4, type: 'sent', count: 120 },
  { eventId: 'e5', seq: 5, type: 'sent', count: 80 },
  { eventId: 'e6', seq: 6, type: 'paused' },
];

const s = rebuild(events);
// { exists: true, name: 'Spring Sale', segmentId: 'seg:vip', startAt: '2026-03-01T09:00:00Z',
//   status: 'paused', sentCount: 200, lastSeq: 6, seenEventIds: ['e1', ..., 'e6'] }

apply(s, events[3]) === s;                                   // true — duplicate id
apply(s, { eventId: 'late', seq: 4, type: 'renamed', name: 'X' }) === s; // true — stale seq

const s7 = apply(s, { eventId: 'e7', seq: 7, type: 'resumed' });
s7.status;   // 'sending' (sentCount > 0)
s7.lastSeq;  // 7

const s8 = apply(s7, { eventId: 'e8', seq: 8, type: 'archived' });
const s9 = apply(s8, { eventId: 'e9', seq: 9, type: 'sent', count: 5 });
s9.sentCount; // 200 — ignored after archive
s9.lastSeq;   // 9   — but still consumed
s9 === s8;    // false

const snap = snapshot(rebuild(events.slice(0, 3)));
rebuildFrom(snap, events.slice(3)); // deep-equals rebuild(events)
```

## Constraints

- `seq >= 1`, strictly increasing within a campaign's log; `eventId` is unique
  per event. `count >= 1`.
- `apply` is pure: the input `state` and `event` are never mutated, and a
  consumed event always returns a **new** object (even when nothing but
  `lastSeq`/`seenEventIds` changed).
- `seenEventIds.length <= 1000` after any number of events; the retained ids
  are the most recent ones, oldest first.
- `rebuild([])` deep-equals `initialState`; `rebuildFrom(snapshot(s), [])`
  deep-equals `s`.
- `snapshot` must return a copy: mutating it does not affect the state it was
  taken from.
- `rebuild` of 100k events runs in O(n) with no quadratic `seenEventIds`
  handling (a `shift`/`slice` per event is fine; an `includes` scan over 1000
  ids per event is acceptable but mention the Set alternative).

## Target

O(1) amortised per event; O(n) rebuild; snapshot + tail replay equals full
replay for every split point.

Senior signal: ordering the three guards (duplicate → stale → consume) and
explaining why the id window can be bounded; distinguishing "ignored, same
reference" from "consumed no-op, new reference" so callers can use `===` as a
cheap did-anything-change check; keeping `resumed` deterministic by deriving
the target status from `sentCount` rather than storing a hidden
"previous status" field.

## Interviewer follow-up

A new `sent` event arrives with `seq: 12` while `lastSeq` is `10` — a gap.
Should the reducer apply it, buffer it, or reject it, and what does the
consumer need from the log service to tell a gap from a filtered-out event?
How would you version the event schema so a snapshot taken by v1 can be
resumed by v2?
