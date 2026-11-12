import {
  apply,
  fromSnapshot,
  initialState,
  rebuild,
  snapshot,
  type RunEvent,
  type RunState,
} from './events';

let seq = 0;
type Payload<T extends RunEvent['type']> = Omit<
  Extract<RunEvent, { type: T }>,
  'eventId' | 'seq' | 'at' | 'customerId' | 'type'
>;

/** Builds an event with an auto-incremented seq / eventId (`e1`, `e2`, …) and a minute-spaced timestamp. */
function ev<T extends RunEvent['type']>(
  type: T,
  customerId: string,
  payload: Payload<T>,
): RunEvent {
  seq += 1;
  const base = {
    eventId: `e${seq}`,
    seq,
    at: new Date(seq * 60_000).toISOString(),
    customerId,
    type,
  };
  return { ...base, ...payload } as unknown as RunEvent;
}

beforeEach(() => {
  seq = 0;
});

/** One customer's full trip through the welcome journey. */
function trip(customerId: string, branch: 'offer' | 'nudge'): RunEvent[] {
  return [
    ev('entered', customerId, { nodeId: 'start' }),
    ev('moved', customerId, { from: 'start', to: 'welcome' }),
    ev('sent', customerId, { nodeId: 'welcome', templateId: 't1' }),
    ev('moved', customerId, { from: 'welcome', to: 'opened' }),
    ev('moved', customerId, { from: 'opened', to: branch }),
    ev('sent', customerId, {
      nodeId: branch,
      templateId: branch === 'offer' ? 't3' : 't4',
    }),
    ev('moved', customerId, { from: branch, to: 'done' }),
    ev('exited', customerId, { nodeId: 'done' }),
  ];
}

describe('events — apply', () => {
  it('initialState is empty and apply never mutates its input', () => {
    const s0 = initialState();
    expect(s0).toEqual({
      lastSeq: 0,
      appliedIds: new Set(),
      customers: {},
      counters: {
        entered: 0,
        sent: 0,
        failed: 0,
        exited: 0,
        sentByTemplate: {},
        activeByNode: {},
      },
    });
    const frozen = JSON.stringify(snapshot(s0));
    const s1 = apply(s0, ev('entered', 'cust001', { nodeId: 'start' }));
    expect(s1).not.toBe(s0);
    expect(JSON.stringify(snapshot(s0))).toBe(frozen);
    expect(s1.lastSeq).toBe(1);
    expect(s1.appliedIds.has('e1')).toBe(true);
    expect(s1.customers.cust001).toEqual({
      customerId: 'cust001',
      nodeId: 'start',
      status: 'active',
      path: ['start'],
      lastEventSeq: 1,
    });
    expect(s1.counters.entered).toBe(1);
    expect(s1.counters.activeByNode).toEqual({ start: 1 });
  });

  it('folds a full trip: path, counters, activeByNode and sentByTemplate', () => {
    const state = trip('cust001', 'offer').reduce(apply, initialState());
    expect(state.customers.cust001).toMatchObject({
      nodeId: 'done',
      status: 'exited',
      path: ['start', 'welcome', 'opened', 'offer', 'done'],
      lastEventSeq: 8,
    });
    expect(state.counters).toEqual({
      entered: 1,
      sent: 2,
      failed: 0,
      exited: 1,
      sentByTemplate: { t1: 1, t3: 1 },
      activeByNode: {}, // nobody is active any more; zero counts are dropped
    });
    expect(state.lastSeq).toBe(8);

    // a second customer still in flight shows up in activeByNode
    const partial = trip('cust002', 'nudge').slice(0, 4).reduce(apply, state);
    expect(partial.counters.activeByNode).toEqual({ opened: 1 });
    expect(partial.counters.sentByTemplate).toEqual({ t1: 2, t3: 1 });
  });

  it('is idempotent by eventId: a redelivered event returns the same state reference', () => {
    const events = trip('cust001', 'nudge');
    const state = events.reduce(apply, initialState());
    const again = apply(state, events[2]); // the `sent` event delivered twice
    expect(again).toBe(state);
    expect(again.counters.sent).toBe(2);
    // same id, different payload: still ignored — the id is the identity
    const forged: RunEvent = { ...events[2], seq: 99 } as RunEvent;
    expect(apply(state, forged)).toBe(state);
    expect(state.lastSeq).toBe(8);
  });

  it('handles failures and a lost first event (moved/sent for an unknown customer counts as entered)', () => {
    const failed = [
      ev('entered', 'cust001', { nodeId: 'start' }),
      ev('moved', 'cust001', { from: 'start', to: 'welcome' }),
      ev('failed', 'cust001', { nodeId: 'welcome', reason: 'bounced' }),
    ].reduce(apply, initialState());
    expect(failed.customers.cust001).toMatchObject({
      status: 'failed',
      nodeId: 'welcome',
      path: ['start', 'welcome'],
    });
    expect(failed.counters).toMatchObject({
      entered: 1,
      failed: 1,
      activeByNode: {},
    });

    const lost = [
      ev('moved', 'cust009', { from: 'start', to: 'welcome' }),
    ].reduce(apply, initialState());
    expect(lost.customers.cust009).toMatchObject({
      status: 'active',
      nodeId: 'welcome',
      path: ['start', 'welcome'],
    });
    expect(lost.counters).toMatchObject({
      entered: 1,
      activeByNode: { welcome: 1 },
    });

    // out-of-order seq: applied in the order given, lastSeq is the max seen
    const a = ev('entered', 'cust010', { nodeId: 'start' });
    const b = ev('moved', 'cust010', { from: 'start', to: 'welcome' });
    const reordered = [b, a].reduce(apply, initialState());
    expect(reordered.lastSeq).toBe(b.seq);
    expect(reordered.counters.entered).toBe(1);
    expect(reordered.customers.cust010.path).toEqual(['start', 'welcome']);
  });
});

describe('events — rebuild / snapshot', () => {
  it('rebuild from a mid-run snapshot plus the tail equals a full replay, and skips already-applied events', () => {
    const events = [
      ...trip('cust001', 'offer'),
      ...trip('cust002', 'nudge'),
      ...trip('cust003', 'offer'),
    ];
    const full = rebuild(events);
    const mid = rebuild(events.slice(0, 11));
    const snap = snapshot(mid);

    const resumed = rebuild(events.slice(11), snap);
    expect(snapshot(resumed)).toEqual(snapshot(full));
    expect(resumed.counters).toEqual({
      entered: 3,
      sent: 6,
      failed: 0,
      exited: 3,
      sentByTemplate: { t1: 3, t3: 2, t4: 1 },
      activeByNode: {},
    });

    // the server re-sends a few events we already have — nothing double counts
    const overlapping = rebuild(events.slice(6), mid);
    expect(snapshot(overlapping)).toEqual(snapshot(full));
    expect(rebuild([], snap).customers).toEqual(mid.customers);
  });

  it('snapshot is JSON-safe and fromSnapshot restores a working state', () => {
    const events = trip('cust001', 'nudge');
    const state = events.slice(0, 5).reduce(apply, initialState());
    const wire = JSON.parse(JSON.stringify(snapshot(state)));
    expect(Array.isArray(wire.appliedIds)).toBe(true);
    expect(new Set(wire.appliedIds)).toEqual(state.appliedIds);
    expect(wire.lastSeq).toBe(5);

    const restored: RunState = fromSnapshot(wire);
    expect(restored.appliedIds).toBeInstanceOf(Set);
    expect(restored.customers).toEqual(state.customers);
    expect(restored.counters).toEqual(state.counters);

    // restored state keeps de-duplicating and keeps counting
    const dup = apply(restored, events[0]);
    expect(dup).toBe(restored);
    const next = apply(restored, {
      eventId: 'x1',
      seq: 6,
      at: '2026-01-01T00:00:00.000Z',
      customerId: 'cust001',
      type: 'sent',
      nodeId: 'nudge',
      templateId: 't4',
    });
    expect(next.counters.sent).toBe(2);
    expect(next.counters.sentByTemplate).toEqual({ t1: 1, t4: 1 });
    // mutating the wire object afterwards does not reach the restored state
    wire.counters.sent = 999;
    expect(restored.counters.sent).toBe(1);
  });
});
