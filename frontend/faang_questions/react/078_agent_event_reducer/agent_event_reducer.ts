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

export function agentRunReducer(
  _state: RunState,
  _event: AgentEvent,
): RunState {
  throw new Error('Not implemented');
}

export function selectTree(_state: RunState): ToolCallNode[] {
  throw new Error('Not implemented');
}

export function selectRunning(_state: RunState): ToolCall[] {
  throw new Error('Not implemented');
}
