import {
  AgentEvent,
  RunState,
  agentRunReducer,
  initialRunState,
  selectRunning,
  selectTree,
} from './agent_event_reducer';

/** Distributive Omit: keeps every member of the event union. */
type Body = AgentEvent extends infer E ? (E extends AgentEvent ? Omit<E, 'eventId' | 'seq'> : never) : never;

/** Build an event; eventId defaults to `e<seq>` so replays of the same seq are real duplicates. */
function ev(seq: number, body: Body, eventId = `e${seq}`): AgentEvent {
  return { eventId, seq, ...body } as AgentEvent;
}

const runStarted = (seq: number): AgentEvent => ev(seq, { type: 'run_started' });
const callStarted = (seq: number, callId: string, parentId: string | null, tool: string): AgentEvent =>
  ev(seq, { type: 'call_started', callId, parentId, tool });
const callOutput = (seq: number, callId: string, chunk: string): AgentEvent =>
  ev(seq, { type: 'call_output', callId, chunk });
const callFinished = (
  seq: number,
  callId: string,
  status: 'succeeded' | 'failed' | 'cancelled',
  message?: string,
): AgentEvent => ev(seq, { type: 'call_finished', callId, status, message });
const runFinished = (seq: number, status: 'succeeded' | 'failed' | 'cancelled'): AgentEvent =>
  ev(seq, { type: 'run_finished', status });

function applyAll(events: AgentEvent[], state: RunState = initialRunState): RunState {
  return events.reduce(agentRunReducer, state);
}

/** A plain-data snapshot used to detect mutation of a previous state. */
function snapshot(state: RunState) {
  return JSON.stringify({
    status: state.status,
    calls: state.calls,
    rootIds: state.rootIds,
    seen: Array.from(state.seenEventIds).sort(),
    lastSeq: state.lastSeq,
    buffered: state.buffered,
  });
}

/** The canonical in-order script used across tests. */
const script: AgentEvent[] = [
  runStarted(1),
  callStarted(2, 'c1', null, 'fetch_items'),
  callOutput(3, 'c1', 'Loading 120 items\n'),
  callStarted(4, 'c2', 'c1', 'call_model'),
  callOutput(5, 'c2', 'batch 1/4\n'),
  callFinished(6, 'c2', 'succeeded'),
  callOutput(7, 'c1', '120/120 fetched\n'),
  callFinished(8, 'c1', 'failed', 'Validation failed: 3 items'),
  runFinished(9, 'failed'),
];

describe('initial state and run lifecycle', () => {
  it('starts idle with nothing seen; run_started moves it to running and records the event', () => {
    expect(initialRunState.status).toBe('idle');
    expect(initialRunState.calls).toEqual({});
    expect(initialRunState.rootIds).toEqual([]);
    expect(initialRunState.lastSeq).toBe(0);
    expect(initialRunState.buffered).toEqual([]);
    expect(initialRunState.seenEventIds.size).toBe(0);

    const state = agentRunReducer(initialRunState, runStarted(1));
    expect(state.status).toBe('running');
    expect(state.lastSeq).toBe(1);
    expect(state.seenEventIds.has('e1')).toBe(true);
    expect(state.calls).toEqual({});
    expect(state.buffered).toEqual([]);
  });

  it('run_finished sets the terminal status', () => {
    expect(applyAll([runStarted(1), runFinished(2, 'succeeded')]).status).toBe('succeeded');
    expect(applyAll([runStarted(1), runFinished(2, 'failed')]).status).toBe('failed');
  });
});

describe('tool-call tree', () => {
  it('call_started creates a running root call with empty output', () => {
    const state = applyAll([runStarted(1), callStarted(2, 'c1', null, 'fetch_items')]);
    expect(state.rootIds).toEqual(['c1']);
    expect(state.calls.c1).toEqual({
      id: 'c1',
      parentId: null,
      tool: 'fetch_items',
      status: 'running',
      output: '',
      childIds: [],
    });
  });

  it('a nested call_started attaches to its parent and is not a root', () => {
    const state = applyAll([
      runStarted(1),
      callStarted(2, 'c1', null, 'fetch_items'),
      callStarted(3, 'c2', 'c1', 'call_model'),
    ]);
    expect(state.rootIds).toEqual(['c1']);
    expect(state.calls.c1.childIds).toEqual(['c2']);
    expect(state.calls.c2.parentId).toBe('c1');
  });

  it('call_started with an unknown parent is treated as a root', () => {
    const state = applyAll([runStarted(1), callStarted(2, 'c9', 'ghost', 'validate')]);
    expect(state.rootIds).toEqual(['c9']);
    expect(state.calls.c9.parentId).toBe('ghost');
  });

  it('call_output concatenates chunks exactly', () => {
    const state = applyAll([
      runStarted(1),
      callStarted(2, 'c1', null, 'fetch_items'),
      callOutput(3, 'c1', 'Loading'),
      callOutput(4, 'c1', ' 120 items\n'),
    ]);
    expect(state.calls.c1.output).toBe('Loading 120 items\n');
  });

  it('call_output for an unknown callId is ignored but still advances lastSeq', () => {
    const before = applyAll([runStarted(1), callStarted(2, 'c1', null, 'fetch_items')]);
    const after = agentRunReducer(before, callOutput(3, 'nope', 'lost chunk'));

    expect(after.lastSeq).toBe(3);
    expect(after.seenEventIds.has('e3')).toBe(true);
    expect(after.calls).toEqual(before.calls);
    expect(after.calls.c1).toBe(before.calls.c1);
  });

  it('call_finished failed keeps the partial output and stores the message', () => {
    const state = applyAll([
      runStarted(1),
      callStarted(2, 'c1', null, 'validate'),
      callOutput(3, 'c1', 'checked 40/120\n'),
      callFinished(4, 'c1', 'failed', 'Schema mismatch'),
    ]);
    expect(state.calls.c1.status).toBe('failed');
    expect(state.calls.c1.output).toBe('checked 40/120\n');
    expect(state.calls.c1.message).toBe('Schema mismatch');
  });

  it('call_finished for an unknown callId is ignored but still advances lastSeq', () => {
    const before = applyAll([runStarted(1)]);
    const after = agentRunReducer(before, callFinished(2, 'nope', 'succeeded'));
    expect(after.lastSeq).toBe(2);
    expect(after.calls).toEqual({});
  });
});

describe('run_finished cancelled', () => {
  it('cancels every still-running call and leaves finished calls untouched by reference', () => {
    const before = applyAll([
      runStarted(1),
      callStarted(2, 'c1', null, 'fetch_items'),
      callStarted(3, 'c2', 'c1', 'call_model'),
      callStarted(4, 'c3', null, 'validate'),
      callFinished(5, 'c2', 'succeeded'),
    ]);
    const after = agentRunReducer(before, runFinished(6, 'cancelled'));

    expect(after.status).toBe('cancelled');
    expect(after.calls.c1.status).toBe('cancelled');
    expect(after.calls.c3.status).toBe('cancelled');
    expect(after.calls.c2.status).toBe('succeeded');
    expect(after.calls.c2).toBe(before.calls.c2);
  });

  it('run_finished succeeded does not touch calls at all', () => {
    const before = applyAll([runStarted(1), callStarted(2, 'c1', null, 'fetch_items'), callFinished(3, 'c1', 'succeeded')]);
    const after = agentRunReducer(before, runFinished(4, 'succeeded'));
    expect(after.calls).toBe(before.calls);
  });
});

describe('idempotency by eventId', () => {
  it('applying the same event twice returns the same state reference', () => {
    const once = applyAll([runStarted(1), callStarted(2, 'c1', null, 'fetch_items')]);
    const twice = agentRunReducer(once, callStarted(2, 'c1', null, 'fetch_items'));
    expect(twice).toBe(once);
  });

  it('a duplicated call_output does not double the transcript', () => {
    const state = applyAll([
      runStarted(1),
      callStarted(2, 'c1', null, 'fetch_items'),
      callOutput(3, 'c1', 'chunk'),
      callOutput(3, 'c1', 'chunk'),
    ]);
    expect(state.calls.c1.output).toBe('chunk');
  });

  it('a stale seq with an unseen eventId is ignored by reference', () => {
    const state = applyAll(script.slice(0, 4));
    const stale = ev(2, { type: 'call_started', callId: 'zombie', parentId: null, tool: 'ghost' }, 'other-id');
    expect(agentRunReducer(state, stale)).toBe(state);
    expect(state.calls.zombie).toBeUndefined();
  });
});

describe('ordering by seq', () => {
  it('an event ahead of lastSeq + 1 is buffered, not applied', () => {
    const state = applyAll([runStarted(1), callStarted(3, 'c1', null, 'fetch_items')]);
    expect(state.lastSeq).toBe(1);
    expect(state.calls).toEqual({});
    expect(state.buffered).toHaveLength(1);
    expect(state.buffered[0].seq).toBe(3);
    expect(state.seenEventIds.has('e3')).toBe(true);
  });

  it('out-of-order 1, 3, 2 ends equal to in-order 1, 2, 3 with nothing buffered (senior)', () => {
    const [e1, e2, e3] = script;
    const outOfOrder = applyAll([e1, e3, e2]);
    const inOrder = applyAll([e1, e2, e3]);

    expect(outOfOrder.lastSeq).toBe(3);
    expect(outOfOrder.buffered).toEqual([]);
    expect(outOfOrder.calls.c1.output).toBe('Loading 120 items\n');
    expect(outOfOrder).toEqual(inOrder);
  });

  it('drains every contiguous buffered event once the gap fills (1, 4, 3, 2)', () => {
    const [e1, e2, e3, e4] = script;
    const state = applyAll([e1, e4, e3, e2]);
    expect(state.lastSeq).toBe(4);
    expect(state.buffered).toEqual([]);
    expect(state.calls.c1.childIds).toEqual(['c2']);
    expect(state).toEqual(applyAll([e1, e2, e3, e4]));
  });

  it('stops draining at the next gap (1, 4, 2 applies 2 and keeps 4 buffered)', () => {
    const [e1, e2, , e4] = script;
    const state = applyAll([e1, e4, e2]);
    expect(state.lastSeq).toBe(2);
    expect(state.calls.c1).toBeDefined();
    expect(state.calls.c2).toBeUndefined();
    expect(state.buffered.map((e) => e.seq)).toEqual([4]);
  });

  it('a buffered event duplicated before the gap fills is applied exactly once (senior)', () => {
    const [e1, e2, e3] = script;
    const afterFirst = applyAll([e1, e3]);
    const afterDup = agentRunReducer(afterFirst, e3);
    expect(afterDup).toBe(afterFirst);

    const state = agentRunReducer(afterDup, e2);
    expect(state.calls.c1.output).toBe('Loading 120 items\n');
    expect(state.buffered).toEqual([]);
    expect(state.lastSeq).toBe(3);
  });
});

describe('reconnect replay', () => {
  it('replaying 1..3 when already at lastSeq 3 is a no-op by reference for every event (senior)', () => {
    const state = applyAll(script.slice(0, 3));
    expect(state.lastSeq).toBe(3);

    let current = state;
    for (const e of script.slice(0, 3)) {
      current = agentRunReducer(current, e);
      expect(current).toBe(state);
    }
  });

  it('replay followed by genuinely new events continues from the gap', () => {
    const state = applyAll([...script.slice(0, 3), ...script.slice(0, 3), ...script.slice(3, 6)]);
    expect(state.lastSeq).toBe(6);
    expect(state.calls.c2.status).toBe('succeeded');
    expect(state.calls.c2.output).toBe('batch 1/4\n');
  });
});

describe('structural sharing and purity', () => {
  it('calls untouched by an event keep their object identity (senior)', () => {
    const before = applyAll(script.slice(0, 4));
    const after = agentRunReducer(before, callOutput(5, 'c2', 'batch 1/4\n'));

    expect(after.calls.c1).toBe(before.calls.c1);
    expect(after.calls.c2).not.toBe(before.calls.c2);
    expect(after.rootIds).toBe(before.rootIds);
  });

  it('never mutates the previous state', () => {
    const before = applyAll(script.slice(0, 4));
    const frozen = snapshot(before);
    const seenBefore = before.seenEventIds;
    const bufferedBefore = before.buffered;

    agentRunReducer(before, callOutput(5, 'c2', 'batch 1/4\n'));
    agentRunReducer(before, callStarted(9, 'c7', 'c1', 'late'));
    agentRunReducer(before, runFinished(5, 'cancelled'));

    expect(snapshot(before)).toBe(frozen);
    expect(before.seenEventIds).toBe(seenBefore);
    expect(before.seenEventIds.has('e5')).toBe(false);
    expect(before.buffered).toBe(bufferedBefore);
  });

  it('the full script produces the expected final state', () => {
    const state = applyAll(script);
    expect(state.status).toBe('failed');
    expect(state.lastSeq).toBe(9);
    expect(state.calls.c1.status).toBe('failed');
    expect(state.calls.c1.output).toBe('Loading 120 items\n120/120 fetched\n');
    expect(state.calls.c1.message).toBe('Validation failed: 3 items');
    expect(state.calls.c2.status).toBe('succeeded');
  });
});

describe('selectors', () => {
  // c3 is inserted before c2 so insertion order differs from tree order
  const treeState = () =>
    applyAll([
      runStarted(1),
      callStarted(2, 'c1', null, 'fetch_items'),
      callStarted(3, 'c3', null, 'validate'),
      callStarted(4, 'c2', 'c1', 'call_model'),
      callStarted(5, 'c4', 'c2', 'batch_1'),
      callFinished(6, 'c4', 'succeeded'),
    ]);

  it('selectTree nests children in rootIds / childIds order', () => {
    const tree = selectTree(treeState());
    expect(tree.map((n) => n.id)).toEqual(['c1', 'c3']);
    expect(tree[0].children.map((n) => n.id)).toEqual(['c2']);
    expect(tree[0].children[0].children.map((n) => n.id)).toEqual(['c4']);
    expect(tree[0].children[0].children[0].status).toBe('succeeded');
    expect(tree[1].children).toEqual([]);
    expect(tree[0].tool).toBe('fetch_items');
  });

  it('selectRunning returns running calls in depth-first tree order, not insertion order', () => {
    expect(selectRunning(treeState()).map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
  });

  it('selectRunning is empty after the run is cancelled', () => {
    const cancelled = agentRunReducer(treeState(), runFinished(7, 'cancelled'));
    expect(selectRunning(cancelled)).toEqual([]);
    expect(selectTree(cancelled)[0].children[0].children[0].status).toBe('succeeded');
  });
});
