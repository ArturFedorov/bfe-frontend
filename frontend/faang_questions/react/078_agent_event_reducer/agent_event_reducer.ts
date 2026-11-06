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

function insertBySeq(buffered: AgentEvent[], event: AgentEvent): AgentEvent[] {
  const index = buffered.findIndex((e) => e.seq > event.seq);
  return index === -1
    ? [...buffered, event]
    : [...buffered.slice(0, index), event, ...buffered.slice(index)];
}

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
        event.parentId !== null ? state.calls[event.parentId] : null;
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

      return {
        ...base,
        calls: { ...state.calls, [call.id]: call },
        rootIds: [...state.rootIds, call.id],
      };
    }

    case 'call_output': {
      const call = state.calls[event.callId];
      if (!call) return base;
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

      let calls = state.calls;
      for (const call of Object.values(calls)) {
        if (call.status === 'running') {
          if (calls === state.calls) calls = { ...state.calls };
          calls[call.id] = { ...call, status: 'cancelled' };
        }
      }

      return { ...base, status: 'cancelled', calls };
    }
  }
}

export function agentRunReducer(
  _state: RunState,
  _event: AgentEvent,
): RunState {
  if (_state.seenEventIds.has(_event.eventId)) return _state;

  if (_event.seq <= _state.lastSeq) return _state;

  const seen = new Set(_state.seenEventIds).add(_event.eventId);

  if (_event.seq > _state.lastSeq + 1) {
    return {
      ..._state,
      seenEventIds: seen,
      buffered: insertBySeq(_state.buffered, _event),
    };
  }

  let next = applyEvent({ ..._state, seenEventIds: seen }, _event);
  while (
    next.buffered.length > 0 &&
    next.buffered[0].seq === next.lastSeq + 1
  ) {
    const [head, ...rest] = next.buffered;
    next = applyEvent({ ...next, buffered: rest }, head);
  }

  return next;
}

export function selectTree(_state: RunState): ToolCallNode[] {
  const build = (id: string): ToolCallNode => {
    const call = _state.calls[id];
    return { ...call, children: call.childIds.map(build) };
  };

  return _state.rootIds.map(build);
}

export function selectRunning(_state: RunState): ToolCall[] {
  const out: ToolCall[] = [];
  const visit = (node: ToolCallNode) => {
    if (node.status === 'running') {
      const { children: _children, ...call } = node;
      out.push(call);
    }

    node.children.forEach(visit);
  };

  selectTree(_state).forEach(visit);
  return out;
}
