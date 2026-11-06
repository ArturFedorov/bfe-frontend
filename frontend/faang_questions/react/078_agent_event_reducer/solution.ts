/**
 * Reference solution for 078 — keep agent_event_reducer.ts blank for redo
 * practice; this file is for comparison after your own attempt.
 */
export type CallStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';
export type RunStatus =
  | 'idle'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';
export type FinishStatus = 'succeeded' | 'failed' | 'cancelled';

interface EventBase {
  eventId: string;
  seq: number;
}

export type AgentEvent =
  | (EventBase & { type: 'run_started' })
  | (EventBase & {
      type: 'call_started';
      callId: string;
      parentId: string | null;
      tool: string;
    })
  | (EventBase & { type: 'call_output'; callId: string; chunk: string })
  | (EventBase & {
      type: 'call_finished';
      callId: string;
      status: FinishStatus;
      message?: string;
    })
  | (EventBase & { type: 'run_finished'; status: FinishStatus });

export interface ToolCall {
  id: string;
  parentId: string | null;
  tool: string;
  status: CallStatus;
  output: string;
  message?: string;
  childIds: string[];
}

export interface ToolCallNode extends ToolCall {
  children: ToolCallNode[];
}

export interface RunState {
  status: RunStatus;
  calls: Record<string, ToolCall>;
  rootIds: string[];
  seenEventIds: Set<string>;
  lastSeq: number;
  buffered: AgentEvent[];
}

export const initialRunState: RunState = {
  status: 'idle',
  calls: {},
  rootIds: [],
  seenEventIds: new Set<string>(),
  lastSeq: 0,
  buffered: [],
};

// ---------------------------------------------------------------------------
// Ordering layer: idempotency, stale replays, gap buffering, draining.
// ---------------------------------------------------------------------------

export function agentRunReducer(state: RunState, event: AgentEvent): RunState {
  // 1. Idempotent: already applied OR already sitting in the buffer.
  if (state.seenEventIds.has(event.eventId)) return state;
  // 2. Stale replay with a new id (e.g. the server re-sent an older event).
  if (event.seq <= state.lastSeq) return state;

  const seen = new Set(state.seenEventIds).add(event.eventId);

  // 3. Ahead of the gap: remember it, do not apply, do not bump lastSeq.
  if (event.seq > state.lastSeq + 1) {
    return {
      ...state,
      seenEventIds: seen,
      buffered: insertBySeq(state.buffered, event),
    };
  }

  // 4. Contiguous: apply, then drain the buffer while it stays contiguous.
  let next = applyEvent({ ...state, seenEventIds: seen }, event);
  while (
    next.buffered.length > 0 &&
    next.buffered[0].seq === next.lastSeq + 1
  ) {
    const [head, ...rest] = next.buffered;
    next = applyEvent({ ...next, buffered: rest }, head);
  }
  return next;
}

function insertBySeq(buffered: AgentEvent[], event: AgentEvent): AgentEvent[] {
  const index = buffered.findIndex((e) => e.seq > event.seq);
  return index === -1
    ? [...buffered, event]
    : [...buffered.slice(0, index), event, ...buffered.slice(index)];
}

// ---------------------------------------------------------------------------
// Domain layer: what each event does to the tree. Always returns new objects
// only along the touched path; everything else keeps its identity.
// ---------------------------------------------------------------------------

function applyEvent(state: RunState, event: AgentEvent): RunState {
  const base: RunState = { ...state, lastSeq: event.seq };

  switch (event.type) {
    case 'run_started':
      return { ...base, status: 'running' };

    case 'call_started': {
      const call: ToolCall = {
        id: event.callId,
        parentId: event.parentId,
        tool: event.tool,
        status: 'running',
        output: '',
        childIds: [],
      };
      const parent =
        event.parentId !== null ? state.calls[event.parentId] : undefined;
      if (parent) {
        return {
          ...base,
          calls: {
            ...state.calls,
            [parent.id]: { ...parent, childIds: [...parent.childIds, call.id] },
            [call.id]: call,
          },
        };
      }
      // No parent, or an unknown one: the call becomes a root.
      return {
        ...base,
        calls: { ...state.calls, [call.id]: call },
        rootIds: [...state.rootIds, call.id],
      };
    }

    case 'call_output': {
      const call = state.calls[event.callId];
      if (!call) return base; // unknown call: applied (seq advanced) but no-op
      return {
        ...base,
        calls: {
          ...state.calls,
          [call.id]: { ...call, output: call.output + event.chunk },
        },
      };
    }

    case 'call_finished': {
      const call = state.calls[event.callId];
      if (!call) return base;
      const finished: ToolCall = { ...call, status: event.status };
      if (event.message !== undefined) finished.message = event.message;
      return { ...base, calls: { ...state.calls, [call.id]: finished } };
    }

    case 'run_finished': {
      if (event.status !== 'cancelled')
        return { ...base, status: event.status };
      // Cancelling the run cancels only what is still running; finished calls keep identity.
      let calls = state.calls;
      for (const call of Object.values(state.calls)) {
        if (call.status === 'running') {
          if (calls === state.calls) calls = { ...state.calls };
          calls[call.id] = { ...call, status: 'cancelled' };
        }
      }
      return { ...base, status: 'cancelled', calls };
    }
  }
}

// ---------------------------------------------------------------------------
// Selectors: derive the nested view; never stored in state.
// ---------------------------------------------------------------------------

export function selectTree(state: RunState): ToolCallNode[] {
  const build = (id: string): ToolCallNode => {
    const call = state.calls[id];
    return { ...call, children: call.childIds.map(build) };
  };
  return state.rootIds.map(build);
}

export function selectRunning(state: RunState): ToolCall[] {
  const out: ToolCall[] = [];
  const visit = (node: ToolCallNode) => {
    if (node.status === 'running') {
      const { children: _children, ...call } = node;
      out.push(call);
    }
    node.children.forEach(visit);
  };
  selectTree(state).forEach(visit);
  return out;
}
