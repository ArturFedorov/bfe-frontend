import type { ReactElement } from 'react';

export type StepStatus = 'running' | 'ok' | 'error';
export type RunStatus = 'running' | 'succeeded' | 'failed' | 'cancelled';

export type RunEvent =
  | { type: 'step_started'; stepId: string; name: string }
  | { type: 'step_output'; stepId: string; chunk: string }
  | { type: 'step_finished'; stepId: string; status: 'ok' | 'error'; message?: string }
  | { type: 'run_finished'; status: 'succeeded' | 'failed' };

export interface AgentStep {
  id: string;
  name: string;
  status: StepStatus;
  output: string;
  message?: string;
}

export interface AgentRunTimelineProps {
  /** Starts a run and streams its events. Must stop yielding once the signal is aborted. */
  run: (signal: AbortSignal) => AsyncIterable<RunEvent>;
}

export function AgentRunTimeline(props: AgentRunTimelineProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}
