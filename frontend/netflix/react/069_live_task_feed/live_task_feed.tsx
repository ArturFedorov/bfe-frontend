import type { ReactElement } from 'react';

export type TaskStatus = 'queued' | 'in_review' | 'approved' | 'rejected';

export interface AnnotationTask {
  id: string;
  title: string;
  status: TaskStatus;
  version: number;
}

export type FeedEvent =
  | { seq: number; type: 'task_upserted'; task: AnnotationTask }
  | { seq: number; type: 'task_removed'; taskId: string; version: number };

export interface FeedHandlers {
  onEvent: (event: FeedEvent) => void;
  onClose: () => void; // server closed or network dropped
  onError: (error: Error) => void;
}

export interface FeedConnection {
  close: () => void;
}

export interface LiveTaskFeedProps {
  /** Opens a connection; `since` is the last applied seq (0 on first connect) so the server can replay. */
  connect: (since: number, handlers: FeedHandlers) => FeedConnection;
  /** Initial reconnect delay; doubles per consecutive failure. Default 1000. */
  reconnectMs?: number;
  /** Cap for the backoff. Default 8000. */
  maxReconnectMs?: number;
}

export function LiveTaskFeed(props: LiveTaskFeedProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}
