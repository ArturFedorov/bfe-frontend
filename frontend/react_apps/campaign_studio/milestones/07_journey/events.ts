/**
 * Milestone 7b — event-sourced run log for a journey execution.
 * See README.md in this folder. Tests: events.test.ts.
 *
 * The server streams `RunEvent`s (possibly re-delivering some); the client
 * folds them into a `RunState`. Snapshots let a client resume without
 * replaying everything from the beginning.
 */

export type RunEventType = 'entered' | 'moved' | 'sent' | 'failed' | 'exited';

export interface RunEventBase {
  /** Globally unique; the same id delivered twice must be applied once. */
  eventId: string;
  /** Monotonic per run. */
  seq: number;
  at: string;
  customerId: string;
}

export type RunEvent =
  | (RunEventBase & { type: 'entered'; nodeId: string })
  | (RunEventBase & { type: 'moved'; from: string; to: string })
  | (RunEventBase & { type: 'sent'; nodeId: string; templateId: string })
  | (RunEventBase & { type: 'failed'; nodeId: string; reason: string })
  | (RunEventBase & { type: 'exited'; nodeId: string });

export type CustomerStatus = 'active' | 'failed' | 'exited';

export interface CustomerProgress {
  customerId: string;
  nodeId: string;
  status: CustomerStatus;
  /** Node ids visited, in order, including the current one. */
  path: string[];
  lastEventSeq: number;
}

export interface RunCounters {
  entered: number;
  sent: number;
  failed: number;
  exited: number;
  /** `sent` events grouped by template. */
  sentByTemplate: Record<string, number>;
  /** Customers currently sitting at each node (active only). */
  activeByNode: Record<string, number>;
}

export interface RunState {
  /** Highest `seq` applied. 0 when empty. */
  lastSeq: number;
  /** Every applied eventId. */
  appliedIds: ReadonlySet<string>;
  customers: Readonly<Record<string, CustomerProgress>>;
  counters: RunCounters;
}

/** JSON-serialisable form of RunState. */
export interface Snapshot {
  lastSeq: number;
  appliedIds: string[];
  customers: Record<string, CustomerProgress>;
  counters: RunCounters;
}

export function initialState(): RunState {
  throw new Error('Not implemented');
}

/**
 * Folds one event. Immutable: returns a new state, or the *same* reference when
 * the event is a duplicate (eventId already applied) and nothing changes.
 * Events are applied in the order given even if `seq` is out of order; `lastSeq`
 * is the max seen. An event for a customer that never `entered` is applied as if
 * they entered at that node (robust to a lost first event).
 */
export function apply(state: RunState, event: RunEvent): RunState {
  void state;
  void event;
  throw new Error('Not implemented');
}

/** Folds many events, starting from `from` (or `initialState()`), skipping any already applied. */
export function rebuild(
  events: readonly RunEvent[],
  from?: RunState | Snapshot,
): RunState {
  void events;
  void from;
  throw new Error('Not implemented');
}

export function snapshot(state: RunState): Snapshot {
  void state;
  throw new Error('Not implemented');
}

export function fromSnapshot(snap: Snapshot): RunState {
  void snap;
  throw new Error('Not implemented');
}
