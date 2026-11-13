import { ReactElement } from 'react';

export type Decision = 'approve' | 'reject' | 'skip' | 'flag';

export interface Task {
  id: string;
  text: string;
  /** Epoch ms at which the server lease on this task lapses unless renewed. */
  leaseExpiresAt: number;
}

export interface QueueApi {
  /** Lease and return the next task, or `null` when the queue is empty. */
  next(): Promise<Task | null>;
  /** Heartbeat: extend the lease on `taskId`. */
  renew(taskId: string): Promise<void>;
  /** Record a decision. Rejects with `{ code: 'lease_expired' }` when the lease lapsed. */
  submit(taskId: string, decision: Decision): Promise<void>;
}

/** Errors thrown by the api may carry a machine-readable code. */
export type QueueError = Error & { code?: string };

export interface ReviewQueueProps {
  api: QueueApi;
  /** Interval between `renew` calls while a task is shown. Default 15000. */
  heartbeatMs?: number;
}

export function ReviewQueue(props: ReviewQueueProps): ReactElement {
  throw new Error('Not implemented');
}
